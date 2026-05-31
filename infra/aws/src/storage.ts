import { RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { dedicatedBucketName } from './naming';

export interface StorageResources {
  appBucket?: s3.IBucket;
}

export function createStorageResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  instanceRole: iam.IRole,
): StorageResources {
  if (config.storage.appBucketMode === 'none') {
    return {};
  }

  if (config.storage.appBucketMode === 'shared') {
    const bucket = s3.Bucket.fromBucketName(
      scope,
      'SharedBucket',
      config.storage.sharedBucketName!,
    );
    bucket.grantReadWrite(instanceRole);

    return {
      appBucket: bucket,
    };
  }

  const bucket = new s3.Bucket(scope, 'AppBucket', {
    bucketName: config.storage.dedicatedBucketName ?? dedicatedBucketName(config),
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: true,
    removalPolicy: RemovalPolicy.RETAIN,
  });

  bucket.grantReadWrite(instanceRole);

  return {
    appBucket: bucket,
  };
}