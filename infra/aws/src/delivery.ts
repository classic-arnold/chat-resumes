import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { ComputeResources } from './compute';
import { resourceName, runtimeParameterPrefix } from './naming';

export interface DeliveryResources {
  repository: ecr.Repository;
  deploymentApplication: codedeploy.ServerApplication;
  deploymentGroup: codedeploy.ServerDeploymentGroup;
  buildProject: codebuild.PipelineProject;
  pipeline: codepipeline.Pipeline;
}

function dirnamePosix(filePath: string): string {
  const separatorIndex = filePath.lastIndexOf('/');

  return separatorIndex === -1 ? '.' : filePath.slice(0, separatorIndex);
}

function basenamePosix(filePath: string): string {
  const separatorIndex = filePath.lastIndexOf('/');

  return separatorIndex === -1 ? filePath : filePath.slice(separatorIndex + 1);
}

function relativePosix(fromPath: string, toPath: string): string {
  if (fromPath === '.' || fromPath === '') {
    return toPath;
  }

  const prefix = `${fromPath}/`;

  return toPath.startsWith(prefix) ? toPath.slice(prefix.length) : toPath;
}

function commonAncestorPosix(paths: string[]): string {
  const pathSegments = paths
    .map((value) => value.split('/').filter(Boolean))
    .filter((segments) => segments.length > 0);

  if (pathSegments.length === 0) {
    return '.';
  }

  const ancestor: string[] = [];

  for (let index = 0; ; index += 1) {
    const candidate = pathSegments[0][index];

    if (!candidate || pathSegments.some((segments) => segments[index] !== candidate)) {
      break;
    }

    ancestor.push(candidate);
  }

  return ancestor.length > 0 ? ancestor.join('/') : '.';
}

function defaultPushPathFilter(config: ResolvedInfraConfig): string {
  const dockerfilePath = config.deployment.build.dockerfilePath ?? 'Dockerfile';
  const buildSpecPath = config.deployment.build.buildSpecPath;
  const triggerRoot = commonAncestorPosix([
    dirnamePosix(dockerfilePath),
    dirnamePosix(buildSpecPath),
  ]);

  return triggerRoot === '.' ? '**/*' : `${triggerRoot}/**`;
}

function createPipelineBuildSpec(
  config: ResolvedInfraConfig,
): codebuild.BuildSpec {
  const dockerfilePath = config.deployment.build.dockerfilePath ?? 'Dockerfile';
  const productDir = dirnamePosix(dockerfilePath);
  const deployDir = dirnamePosix(config.deployment.build.buildSpecPath);
  const deploySubdir = relativePosix(productDir, deployDir) || '.';
  const artifactDir = 'codebuild-artifacts';
  const buildScript = [
    'set -eu',
    'mkdir -p "${ARTIFACTS_DIR}"',
    'if [ -e "${DOCKERFILE_PATH}" ]; then RESOLVED_DOCKERFILE_PATH="${DOCKERFILE_PATH}"; elif [ -e "${DOCKERFILE_BASENAME}" ]; then RESOLVED_DOCKERFILE_PATH="${DOCKERFILE_BASENAME}"; else RESOLVED_DOCKERFILE_PATH="$(find . -path "*/${DOCKERFILE_PATH}" | head -n 1)"; if [ -z "${RESOLVED_DOCKERFILE_PATH}" ]; then RESOLVED_DOCKERFILE_PATH="$(find . -name "${DOCKERFILE_BASENAME}" | head -n 1)"; fi; fi',
    'if [ -z "${RESOLVED_DOCKERFILE_PATH:-}" ]; then echo "Unable to resolve Dockerfile path: ${DOCKERFILE_PATH}"; find . -maxdepth 5 -name "${DOCKERFILE_BASENAME}" | sort; exit 1; fi',
    'RESOLVED_DOCKERFILE_PATH="${RESOLVED_DOCKERFILE_PATH#./}"',
    'RESOLVED_PRODUCT_DIR="$(dirname "${RESOLVED_DOCKERFILE_PATH}")"',
    'if [ -d "${DEPLOY_DIR}" ]; then RESOLVED_DEPLOY_DIR="${DEPLOY_DIR}"; elif [ -n "${DEPLOY_SUBDIR}" ] && [ -d "${RESOLVED_PRODUCT_DIR}/${DEPLOY_SUBDIR}" ]; then RESOLVED_DEPLOY_DIR="${RESOLVED_PRODUCT_DIR}/${DEPLOY_SUBDIR}"; elif [ -n "${DEPLOY_SUBDIR}" ] && [ -d "${DEPLOY_SUBDIR}" ]; then RESOLVED_DEPLOY_DIR="${DEPLOY_SUBDIR}"; else RESOLVED_DEPLOY_DIR="$(find . -path "*/${DEPLOY_DIR}" -type d | head -n 1)"; fi',
    'if [ -z "${RESOLVED_DEPLOY_DIR:-}" ]; then echo "Unable to resolve deploy dir: ${DEPLOY_DIR}"; find . -maxdepth 6 -type d | sort | head -100; exit 1; fi',
    'RESOLVED_DEPLOY_DIR="${RESOLVED_DEPLOY_DIR#./}"',
    'echo "Resolved dockerfile: ${RESOLVED_DOCKERFILE_PATH}"',
    'echo "Resolved product dir: ${RESOLVED_PRODUCT_DIR}"',
    'echo "Resolved deploy dir: ${RESOLVED_DEPLOY_DIR}"',
    'REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"',
    'echo "Logging into ${REGISTRY}"',
    'aws ecr get-login-password --region "${AWS_DEFAULT_REGION}" | docker login --username AWS --password-stdin "${REGISTRY}"',
    'docker build --target backend -f "${RESOLVED_DOCKERFILE_PATH}" -t "${IMAGE_REPO_NAME}:${IMAGE_TAG}" "${RESOLVED_PRODUCT_DIR}"',
    'REPOSITORY_URI="${REGISTRY}/${IMAGE_REPO_NAME}"',
    'docker tag "${IMAGE_REPO_NAME}:${IMAGE_TAG}" "${REPOSITORY_URI}:${IMAGE_TAG}"',
    'docker push "${REPOSITORY_URI}:${IMAGE_TAG}"',
    'cp "${RESOLVED_DEPLOY_DIR}/appspec.yml" "${ARTIFACTS_DIR}/appspec.yml"',
    'cp "${RESOLVED_DEPLOY_DIR}/"*.sh "${ARTIFACTS_DIR}/"',
    'printf "APP_SLUG=%s\\nAPP_DIR=%s\\nAPP_PORT=%s\\nCONTAINER_NAME=%s\\nHEALTH_CHECK_PATH=%s\\nRUNTIME_PARAMETER_PREFIX=%s\\n" "${APP_SLUG}" "${APP_DIR}" "${APP_PORT}" "${CONTAINER_NAME}" "${HEALTH_CHECK_PATH}" "${RUNTIME_PARAMETER_PREFIX}" > "${ARTIFACTS_DIR}/deploy-metadata.env"',
    'printf %s "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}:${IMAGE_TAG}" > "${ARTIFACTS_DIR}/image-uri.txt"',
    'cat "${ARTIFACTS_DIR}/image-uri.txt"',
  ].join('\n');

  return codebuild.BuildSpec.fromObjectToYaml({
    version: '0.2',
    env: {
      variables: {
        PRODUCT_DIR: productDir,
        DEPLOY_DIR: deployDir,
        DEPLOY_SUBDIR: deploySubdir,
        DOCKERFILE_BASENAME: basenamePosix(dockerfilePath),
        ARTIFACTS_DIR: artifactDir,
        APP_SLUG: config.app.slug,
        APP_DIR: '/home/ec2-user/app',
        APP_PORT: `${config.app.port}`,
        CONTAINER_NAME: `${config.app.slug}-backend`,
        HEALTH_CHECK_PATH: config.app.healthCheckPath,
        RUNTIME_PARAMETER_PREFIX: runtimeParameterPrefix(config),
      },
    },
    phases: {
      install: {
        commands: [
          'echo "=== Install Phase ==="',
          'aws --version',
          'docker --version',
        ],
      },
      build: {
        commands: [
          'echo "=== Build Phase ==="',
          buildScript,
        ],
      },
    },
    artifacts: {
      files: ['appspec.yml', '*.sh', 'deploy-metadata.env', 'image-uri.txt'],
      'base-directory': artifactDir,
      'discard-paths': 'no',
    },
  });
}

export function createDeliveryResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  compute: ComputeResources,
): DeliveryResources {
  const repository = new ecr.Repository(scope, 'Repository', {
    repositoryName: config.deployment.ecr.repositoryName,
    imageTagMutability:
      config.deployment.ecr.imageTagMutability === 'immutable'
        ? ecr.TagMutability.IMMUTABLE
        : ecr.TagMutability.MUTABLE,
    imageScanOnPush: true,
  });

  const deploymentApplication = new codedeploy.ServerApplication(
    scope,
    'CodeDeployApplication',
    {
      applicationName: resourceName(config, 'codedeploy-app', 100),
    },
  );

  const deploymentGroup = new codedeploy.ServerDeploymentGroup(
    scope,
    'CodeDeployDeploymentGroup',
    {
      application: deploymentApplication,
      deploymentGroupName: resourceName(config, 'codedeploy-dg', 100),
      autoScalingGroups: [compute.autoScalingGroup],
      installAgent: config.deployment.codedeploy.installAgent,
      deploymentConfig: codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME,
      loadBalancers: [codedeploy.LoadBalancer.application(compute.targetGroup)],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
    },
  );

  const cfnDeploymentGroup = deploymentGroup.node
    .defaultChild as codedeploy.CfnDeploymentGroup;
  cfnDeploymentGroup.alarmConfiguration = {
    enabled: false,
    ignorePollAlarmFailure: true,
  };

  const buildProject = new codebuild.PipelineProject(scope, 'BuildProject', {
    projectName: resourceName(config, 'build', 255),
    buildSpec: createPipelineBuildSpec(config),
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      privileged: true,
    },
  });

  repository.grantPullPush(buildProject);
  buildProject.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['sts:GetCallerIdentity'],
      resources: ['*'],
    }),
  );

  const sourceOutput = new codepipeline.Artifact('Source');
  const buildOutput = new codepipeline.Artifact('Build');
  const pushPaths =
    config.deployment.github.pushPaths && config.deployment.github.pushPaths.length > 0
      ? config.deployment.github.pushPaths
      : [defaultPushPathFilter(config)];
  const sourceAction = new codepipelineActions.CodeStarConnectionsSourceAction({
    actionName: 'Source',
    owner: config.deployment.github.owner,
    repo: config.deployment.github.repo,
    branch: config.deployment.github.branch,
    connectionArn: config.deployment.github.connectionArn,
    output: sourceOutput,
    triggerOnPush: false,
  });

  const pipeline = new codepipeline.Pipeline(scope, 'Pipeline', {
    pipelineName: resourceName(config, 'pipeline', 100),
    crossAccountKeys: false,
    pipelineType: codepipeline.PipelineType.V2,
    restartExecutionOnUpdate: true,
    triggers: [
      {
        providerType: codepipeline.ProviderType.CODE_STAR_SOURCE_CONNECTION,
        gitConfiguration: {
          sourceAction,
          pushFilter: [
            {
              branchesIncludes: [config.deployment.github.branch],
              filePathsIncludes: pushPaths,
            },
          ],
        },
      },
    ],
  });

  pipeline.addStage({
    stageName: 'Source',
    actions: [sourceAction],
  });

  pipeline.addStage({
    stageName: 'Build',
    actions: [
      new codepipelineActions.CodeBuildAction({
        actionName: 'BuildAndPackage',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
        environmentVariables: {
          AWS_ACCOUNT_ID: {
            value: config.app.account,
          },
          AWS_DEFAULT_REGION: {
            value: config.app.region,
          },
          IMAGE_REPO_NAME: {
            value: repository.repositoryName,
          },
          IMAGE_TAG: {
            value: config.deployment.build.imageTag,
          },
          DOCKERFILE_PATH: {
            value: config.deployment.build.dockerfilePath ?? 'Dockerfile',
          },
        },
      }),
    ],
  });

  pipeline.addStage({
    stageName: 'Deploy',
    actions: [
      new codepipelineActions.CodeDeployServerDeployAction({
        actionName: 'DeployToEc2',
        deploymentGroup,
        input: buildOutput,
      }),
    ],
  });

  return {
    repository,
    deploymentApplication,
    deploymentGroup,
    buildProject,
    pipeline,
  };
}