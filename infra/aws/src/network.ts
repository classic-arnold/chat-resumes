import { Fn, RemovalPolicy } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { resourceName } from './naming';

export interface NetworkResources {
  vpc: ec2.Vpc;
  albSecurityGroup: ec2.SecurityGroup;
  appSecurityGroup: ec2.SecurityGroup;
  dataSecurityGroup: ec2.SecurityGroup;
  publicSubnets: ec2.SelectedSubnets;
  applicationSubnets: ec2.SelectedSubnets;
  dataSubnets: ec2.SelectedSubnets;
}

export function createNetworkResources(
  scope: Construct,
  config: ResolvedInfraConfig,
): NetworkResources {
  const applicationSubnetType =
    config.network.instanceSubnetType === 'private'
      ? ec2.SubnetType.PRIVATE_WITH_EGRESS
      : ec2.SubnetType.PUBLIC;

  const vpc = new ec2.Vpc(scope, 'Vpc', {
    availabilityZones: Array.from({ length: config.network.maxAzs }, (_, index) =>
      Fn.select(index, Fn.getAzs()),
    ),
    ipAddresses: ec2.IpAddresses.cidr(config.network.vpcCidr),
    natGateways:
      applicationSubnetType === ec2.SubnetType.PRIVATE_WITH_EGRESS
        ? config.network.natGateways
        : 0,
    restrictDefaultSecurityGroup: true,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'app',
        subnetType: applicationSubnetType,
      },
      {
        cidrMask: 24,
        name: 'data',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });

  if (config.network.enableFlowLogs) {
    const flowLogGroup = new logs.LogGroup(scope, 'VpcFlowLogs', {
      logGroupName: `/aws/vpc/${resourceName(config, 'flow-logs', 120)}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    vpc.addFlowLog('FlowLogs', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });
  }

  const albSecurityGroup = new ec2.SecurityGroup(scope, 'AlbSecurityGroup', {
    vpc,
    allowAllOutbound: true,
    description: 'Internet-facing ALB access',
    securityGroupName: resourceName(config, 'alb-sg', 255),
  });
  albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
  albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

  const appSecurityGroup = new ec2.SecurityGroup(scope, 'AppSecurityGroup', {
    vpc,
    allowAllOutbound: true,
    description: 'Application instance access',
    securityGroupName: resourceName(config, 'app-sg', 255),
  });
  appSecurityGroup.addIngressRule(
    albSecurityGroup,
    ec2.Port.tcp(config.app.port),
    'ALB to application port',
  );

  if (
    config.network.instanceSubnetType === 'public' &&
    config.compute.keyPairName
  ) {
    appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Optional SSH access when using a key pair',
    );
  }

  const dataSecurityGroup = new ec2.SecurityGroup(scope, 'DataSecurityGroup', {
    vpc,
    allowAllOutbound: true,
    description: 'Managed data service access',
    securityGroupName: resourceName(config, 'data-sg', 255),
  });

  return {
    vpc,
    albSecurityGroup,
    appSecurityGroup,
    dataSecurityGroup,
    publicSubnets: vpc.selectSubnets({ subnetGroupName: 'public' }),
    applicationSubnets: vpc.selectSubnets({ subnetGroupName: 'app' }),
    dataSubnets: vpc.selectSubnets({ subnetGroupName: 'data' }),
  };
}