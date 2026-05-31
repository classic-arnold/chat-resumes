import { Duration, Tags } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { DomainResources } from './dns';
import { resourceName, runtimeParameterPrefix } from './naming';
import { NetworkResources } from './network';

export interface ComputeResources {
  instanceRole: iam.Role;
  launchTemplate: ec2.LaunchTemplate;
  autoScalingGroup: autoscaling.AutoScalingGroup;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  targetGroup: elbv2.ApplicationTargetGroup;
  listener: elbv2.ApplicationListener;
}

function resolveMachineImage(config: ResolvedInfraConfig): ec2.IMachineImage {
  if (config.compute.ami.type === 'ami-id') {
    return ec2.MachineImage.genericLinux({
      [config.app.region]: config.compute.ami.amiId!,
    });
  }

  return ec2.MachineImage.resolveSsmParameterAtLaunch(
    ec2.AmazonLinux2023ImageSsmParameter.ssmParameterName({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    }),
  );
}

function buildUserData(): ec2.UserData {
  const userData = ec2.UserData.forLinux();
  userData.addCommands(
    'set -euxo pipefail',
    'dnf update -y',
    'dnf install -y docker',
    'systemctl enable docker',
    'systemctl start docker',
    'usermod -aG docker ec2-user',
  );
  return userData;
}

export function createComputeResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  network: NetworkResources,
  domain: DomainResources,
): ComputeResources {
  const instanceRole = new iam.Role(scope, 'InstanceRole', {
    assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonEC2ContainerRegistryReadOnly',
      ),
    ],
  });


  const runtimeConfigPrefix =
    `arn:aws:ssm:${config.app.region}:${config.app.account}:parameter${runtimeParameterPrefix(config)}`;
  instanceRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: [runtimeConfigPrefix, `${runtimeConfigPrefix}/*`],
    }),
  );

  const keyPair = config.compute.keyPairName
    ? ec2.KeyPair.fromKeyPairName(scope, 'ImportedKeyPair', config.compute.keyPairName)
    : undefined;

  const launchTemplate = new ec2.LaunchTemplate(scope, 'LaunchTemplate', {
    launchTemplateName: resourceName(config, 'lt', 128),
    machineImage: resolveMachineImage(config),
    instanceType: new ec2.InstanceType(config.compute.instanceType),
    userData: buildUserData(),
    role: instanceRole,
    securityGroup: network.appSecurityGroup,
    blockDevices: [
      {
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(config.compute.rootVolumeGiB, {
          encrypted: true,
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          deleteOnTermination: true,
        }),
      },
    ],
    detailedMonitoring: config.compute.enableDetailedMonitoring,
    keyPair,
    requireImdsv2: config.compute.requireImdsv2,
    associatePublicIpAddress: config.network.instanceSubnetType === 'public',
  });

  const autoScalingGroup = new autoscaling.AutoScalingGroup(scope, 'AutoScalingGroup', {
    vpc: network.vpc,
    launchTemplate,
    minCapacity: config.compute.minCapacity,
    desiredCapacity: config.compute.desiredCapacity,
    maxCapacity: config.compute.maxCapacity,
    vpcSubnets: { subnets: network.applicationSubnets.subnets },
    healthChecks: autoscaling.HealthChecks.withAdditionalChecks({
      gracePeriod: Duration.minutes(10),
      additionalTypes: [autoscaling.AdditionalHealthCheckType.ELB],
    }),
  });
  Tags.of(autoScalingGroup).add('Name', resourceName(config, 'app-instance', 255), {
    applyToLaunchedInstances: true,
  });

  const loadBalancer = new elbv2.ApplicationLoadBalancer(scope, 'LoadBalancer', {
    vpc: network.vpc,
    internetFacing: true,
    securityGroup: network.albSecurityGroup,
    vpcSubnets: { subnets: network.publicSubnets.subnets },
    loadBalancerName: resourceName(config, 'alb', 32),
  });
  loadBalancer.setAttribute('idle_timeout.timeout_seconds', '180');

  const targetGroup = new elbv2.ApplicationTargetGroup(scope, 'TargetGroup', {
    vpc: network.vpc,
    port: config.app.port,
    protocol: elbv2.ApplicationProtocol.HTTP,
    targetType: elbv2.TargetType.INSTANCE,
    healthCheck: {
      enabled: true,
      path: config.app.healthCheckPath,
      healthyHttpCodes: '200-399',
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
    },
    deregistrationDelay: Duration.seconds(30),
  });
  autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

  const listener = domain.certificate
    ? loadBalancer.addListener('HttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [
          elbv2.ListenerCertificate.fromArn(domain.certificate.certificateArn),
        ],
        defaultTargetGroups: [targetGroup],
      })
    : loadBalancer.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });

  if (domain.certificate) {
    loadBalancer.addListener('HttpRedirectListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });
  }

  return {
    instanceRole,
    launchTemplate,
    autoScalingGroup,
    loadBalancer,
    targetGroup,
    listener,
  };
}