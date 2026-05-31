import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { ComputeResources } from './compute';

export interface MonitoringResources {
  alarms: cloudwatch.Alarm[];
}

export function createMonitoringResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  compute: ComputeResources,
): MonitoringResources {
  if (!config.monitoring.enableBasicAlarms) {
    return { alarms: [] };
  }

  const alarms = [
    new cloudwatch.Alarm(scope, 'AsgCpuAlarm', {
      alarmDescription: 'Auto Scaling Group average CPU is above 80%.',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: compute.autoScalingGroup.autoScalingGroupName,
        },
        period: Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    }),
    new cloudwatch.Alarm(scope, 'Alb5xxAlarm', {
      alarmDescription: 'Application load balancer is returning 5xx responses.',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_ELB_5XX_Count',
        dimensionsMap: {
          LoadBalancer: compute.loadBalancer.loadBalancerFullName,
        },
        period: Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    }),
    new cloudwatch.Alarm(scope, 'TargetUnhealthyHostsAlarm', {
      alarmDescription: 'At least one target is unhealthy behind the ALB.',
      metric: compute.targetGroup.metrics.unhealthyHostCount({
        period: Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    }),
  ];

  return { alarms };
}