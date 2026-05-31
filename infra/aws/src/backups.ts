import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as dlm from 'aws-cdk-lib/aws-dlm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { resourceName } from './naming';

export function createBackupResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  autoScalingGroup: autoscaling.AutoScalingGroup,
): void {
  const backupTagKey = 'BackupPolicy';
  const backupTagValue = resourceName(config, 'instance-snapshots', 60);

  Tags.of(autoScalingGroup).add(backupTagKey, backupTagValue, {
    applyToLaunchedInstances: true,
  });

  const role = new iam.Role(scope, 'DlmRole', {
    assumedBy: new iam.ServicePrincipal('dlm.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSDataLifecycleManagerServiceRole',
      ),
    ],
  });

  new dlm.CfnLifecyclePolicy(scope, 'InstanceSnapshotPolicy', {
    description: resourceName(config, 'instance-snapshots', 120),
    executionRoleArn: role.roleArn,
    state: 'ENABLED',
    policyDetails: {
      resourceTypes: ['INSTANCE'],
      targetTags: [
        {
          key: backupTagKey,
          value: backupTagValue,
        },
      ],
      schedules: [
        {
          name: 'DailyInstanceSnapshots',
          copyTags: true,
          createRule: {
            interval: 24,
            intervalUnit: 'HOURS',
            times: ['03:00'],
          },
          retainRule: {
            count: Math.max(1, Math.min(config.data.backupRetentionDays, 35)),
          },
          tagsToAdd: [
            {
              key: 'CreatedBy',
              value: 'product-factory-template',
            },
          ],
          variableTags: [
            {
              key: 'SourceInstance',
              value: '$(instance-id)',
            },
          ],
        },
      ],
    },
    tags: [
      {
        key: 'ManagedBy',
        value: 'product-factory-template',
      },
    ],
  });
}