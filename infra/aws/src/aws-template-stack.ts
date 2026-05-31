import { Annotations, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { createBackupResources } from './backups';
import { ResolvedInfraConfig } from './config';
import { createComputeResources } from './compute';
import { createDataResources } from './data';
import { createAliasRecord, createDomainResources } from './dns';
import { createDeliveryResources } from './delivery';
import { createMonitoringResources } from './monitoring';
import { createNetworkResources } from './network';
import { runtimeParameterPrefix, runtimeSecretPrefix } from './naming';
import { createRuntimeResources } from './runtime';
import { createStorageResources } from './storage';

export class AwsApplicationInfrastructureStack extends Stack {
  public constructor(
    scope: Construct,
    id: string,
    config: ResolvedInfraConfig,
    props?: StackProps,
  ) {
    super(scope, id, props);

    if (config.deployment.codedeploy.deploymentMode === 'blue-green-placeholder') {
      Annotations.of(this).addWarning(
        'Blue/green is intentionally a placeholder in v1. This template still deploys with the in-place EC2 CodeDeploy path.',
      );
    }

    if (
      config.app.stage === 'validation-tool' &&
      (config.data.datastore !== 'none' || config.data.cache !== 'none')
    ) {
      Annotations.of(this).addWarning(
        'Managed data services are enabled on a validation-tool stage. This is supported, but it is intentionally not the default path.',
      );
    }

    const network = createNetworkResources(this, config);
    const domain = createDomainResources(this, config);
    const compute = createComputeResources(this, config, network, domain);
    const storage = createStorageResources(this, config, compute.instanceRole);
    const runtime = createRuntimeResources(this, config, compute.instanceRole);
    const data = createDataResources(this, config, network, compute.instanceRole);
    const monitoring = createMonitoringResources(this, config, compute);
    const delivery = createDeliveryResources(this, config, compute);

    createAliasRecord(this, config, domain, compute.loadBalancer);
    createBackupResources(this, config, compute.autoScalingGroup);

    new CfnOutput(this, 'TemplateStage', {
      description: 'The active stage preset resolved from config/app.json.',
      value: config.app.stage,
    });

    new CfnOutput(this, 'TemplateRegion', {
      description: 'The AWS region this template will target.',
      value: config.app.region,
    });

    new CfnOutput(this, 'AlbDnsName', {
      description: 'Primary ALB DNS name.',
      value: compute.loadBalancer.loadBalancerDnsName,
    });

    new CfnOutput(this, 'ServiceUrl', {
      description: 'The primary public entrypoint for the service.',
      value: config.domain.enabled
        ? `https://${config.domain.domainName}`
        : `http://${compute.loadBalancer.loadBalancerDnsName}`,
    });

    new CfnOutput(this, 'EcrRepositoryName', {
      description: 'ECR repository for application container images.',
      value: delivery.repository.repositoryName,
    });

    new CfnOutput(this, 'CodePipelineName', {
      description: 'The deployment pipeline name.',
      value: delivery.pipeline.pipelineName,
    });

    new CfnOutput(this, 'AutoScalingGroupName', {
      description: 'Application Auto Scaling Group.',
      value: compute.autoScalingGroup.autoScalingGroupName,
    });

    if (storage.appBucket) {
      new CfnOutput(this, 'AppBucketName', {
        description: 'Optional application bucket.',
        value: storage.appBucket.bucketName,
      });
    }

    new CfnOutput(this, 'RuntimeParameterPrefix', {
      description: 'SSM parameter prefix for runtime config.',
      value: `${runtimeParameterPrefix(config)}/`,
    });

    if (Object.keys(runtime.secrets).length > 0) {
      new CfnOutput(this, 'RuntimeSecretPrefix', {
        description: 'Secrets Manager prefix for runtime secrets.',
        value: `${runtimeSecretPrefix(config)}/`,
      });
    }

    if (data.datastoreEndpoint) {
      new CfnOutput(this, 'DatastoreEndpoint', {
        description: 'Managed datastore endpoint if enabled.',
        value: data.datastoreEndpoint,
      });
    }

    if (data.cacheEndpoint) {
      new CfnOutput(this, 'CacheEndpoint', {
        description: 'Managed cache endpoint if enabled.',
        value: data.cacheEndpoint,
      });
    }
  }
}