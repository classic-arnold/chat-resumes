import { Duration, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { ResolvedInfraConfig, sanitizeDatabaseName } from './config';
import { resourceName } from './naming';
import { NetworkResources } from './network';

export interface DataResources {
  datastoreEndpoint?: string;
  datastorePort?: string;
  datastoreSecret?: secretsmanager.ISecret;
  cacheEndpoint?: string;
  cachePort?: string;
  cacheSecret?: secretsmanager.ISecret;
}

function isEphemeralStage(config: ResolvedInfraConfig): boolean {
  return config.app.stage === 'validation-tool';
}

function postgresInstanceType(config: ResolvedInfraConfig): ec2.InstanceType {
  if (config.app.stage === 'validation-tool') {
    return new ec2.InstanceType('t4g.micro');
  }

  if (config.app.stage === 'mvp') {
    return new ec2.InstanceType('t4g.small');
  }

  return new ec2.InstanceType('t4g.medium');
}

function createPostgresDatabase(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
  instanceRole: iam.IRole,
): DataResources {
  network.dataSecurityGroup.addIngressRule(
    network.appSecurityGroup,
    ec2.Port.tcp(5432),
    'Application to PostgreSQL',
  );

  const database = new rds.DatabaseInstance(scope, 'PostgresDatabase', {
    vpc: network.vpc,
    vpcSubnets: { subnets: network.dataSubnets.subnets },
    securityGroups: [network.dataSecurityGroup],
    engine: rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.of('16.13', '16'),
    }),
    instanceType: postgresInstanceType(config),
    credentials: rds.Credentials.fromGeneratedSecret('appadmin'),
    databaseName: sanitizeDatabaseName(config.app.slug),
    allocatedStorage: config.data.multiAz ? 100 : 20,
    maxAllocatedStorage: config.data.multiAz ? 200 : 100,
    backupRetention: Duration.days(config.data.backupRetentionDays),
    multiAz: config.data.multiAz,
    storageEncrypted: true,
    storageType: rds.StorageType.GP3,
    cloudwatchLogsExports: ['postgresql'],
    cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
    deletionProtection: !isEphemeralStage(config),
    deleteAutomatedBackups: isEphemeralStage(config),
    removalPolicy: isEphemeralStage(config)
      ? RemovalPolicy.DESTROY
      : RemovalPolicy.SNAPSHOT,
    publiclyAccessible: false,
  });

  database.secret?.grantRead(instanceRole);

  return {
    datastoreEndpoint: database.dbInstanceEndpointAddress,
    datastorePort: `${database.dbInstanceEndpointPort}`,
    datastoreSecret: database.secret,
  };
}

function createDocumentDbCluster(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
  instanceRole: iam.IRole,
): DataResources {
  network.dataSecurityGroup.addIngressRule(
    network.appSecurityGroup,
    ec2.Port.tcp(27017),
    'Application to DocumentDB',
  );

  const cluster = new docdb.DatabaseCluster(scope, 'DocumentDbCluster', {
    vpc: network.vpc,
    vpcSubnets: { subnets: network.dataSubnets.subnets },
    securityGroup: network.dataSecurityGroup,
    masterUser: {
      username: 'docdbadmin',
    },
    dbClusterName: resourceName(config, 'docdb', 63),
    instanceType: new ec2.InstanceType('r5.large'),
    instances: config.data.multiAz ? 2 : 1,
    backup: {
      retention: Duration.days(config.data.backupRetentionDays),
    },
    cloudWatchLogsRetention: logs.RetentionDays.ONE_MONTH,
    deletionProtection: !isEphemeralStage(config),
    removalPolicy: isEphemeralStage(config)
      ? RemovalPolicy.DESTROY
      : RemovalPolicy.SNAPSHOT,
    storageEncrypted: true,
  });

  cluster.secret?.grantRead(instanceRole);

  return {
    datastoreEndpoint: cluster.clusterEndpoint.hostname,
    datastorePort: `${docdb.DatabaseCluster.DEFAULT_PORT}`,
    datastoreSecret: cluster.secret,
  };
}

function createServerlessCache(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
): DataResources {
  network.dataSecurityGroup.addIngressRule(
    network.appSecurityGroup,
    ec2.Port.tcp(6379),
    'Application to Redis cache',
  );

  const cache = new elasticache.CfnServerlessCache(scope, 'ServerlessCache', {
    engine: 'redis',
    serverlessCacheName: resourceName(config, 'cache', 40),
    description: `${config.app.name} serverless cache`,
    majorEngineVersion: '7',
    securityGroupIds: [network.dataSecurityGroup.securityGroupId],
    subnetIds: network.dataSubnets.subnetIds,
    dailySnapshotTime: '03:00',
    snapshotRetentionLimit: config.data.backupRetentionDays,
  });
  cache.applyRemovalPolicy(
    isEphemeralStage(config) ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
  );

  return {
    cacheEndpoint: cache.attrEndpointAddress,
    cachePort: cache.attrEndpointPort,
  };
}

function createReplicationGroup(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
  instanceRole: iam.IRole,
): DataResources {
  network.dataSecurityGroup.addIngressRule(
    network.appSecurityGroup,
    ec2.Port.tcp(6379),
    'Application to Redis cache',
  );

  const subnetGroup = new elasticache.CfnSubnetGroup(scope, 'CacheSubnetGroup', {
    cacheSubnetGroupName: resourceName(config, 'cache-subnets', 50),
    description: `${config.app.name} cache subnets`,
    subnetIds: network.dataSubnets.subnetIds,
  });

  const authToken = new secretsmanager.Secret(scope, 'CacheAuthToken', {
    secretName: `/products/${config.app.slug}/${config.app.stage}/cache/auth-token`,
    description: `Redis auth token for ${config.app.name}`,
    generateSecretString: {
      excludePunctuation: true,
      passwordLength: 32,
    },
  });
  authToken.grantRead(instanceRole);

  const replicationGroup = new elasticache.CfnReplicationGroup(
    scope,
    'ReplicationGroup',
    {
      replicationGroupDescription: `${config.app.name} replication group`,
      replicationGroupId: resourceName(config, 'cache', 40),
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: config.app.stage === 'growth' ? 'cache.t4g.small' : 'cache.t4g.micro',
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [network.dataSecurityGroup.securityGroupId],
      port: 6379,
      numCacheClusters: config.data.multiAz ? 2 : 1,
      automaticFailoverEnabled: config.data.multiAz,
      multiAzEnabled: config.data.multiAz,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      transitEncryptionMode: 'preferred',
      authToken: authToken.secretValue.toString(),
      snapshotRetentionLimit: config.data.backupRetentionDays,
    },
  );
  replicationGroup.applyRemovalPolicy(
    isEphemeralStage(config) ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
  );

  return {
    cacheEndpoint: replicationGroup.attrPrimaryEndPointAddress,
    cachePort: replicationGroup.attrPrimaryEndPointPort,
    cacheSecret: authToken,
  };
}

export function createDataResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
  instanceRole: iam.IRole,
): DataResources {
  const resources: DataResources = {};

  if (config.data.datastore === 'rds-postgres') {
    Object.assign(resources, createPostgresDatabase(scope, config, network, instanceRole));
  }

  if (config.data.datastore === 'documentdb') {
    Object.assign(resources, createDocumentDbCluster(scope, config, network, instanceRole));
  }

  if (config.data.cache === 'elasticache-serverless') {
    Object.assign(resources, createServerlessCache(scope, config, network));
  }

  if (config.data.cache === 'elasticache-replication-group') {
    Object.assign(resources, createReplicationGroup(scope, config, network, instanceRole));
  }

  return resources;
}