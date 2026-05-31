import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';
import { runtimeParameterPrefix, runtimeSecretPrefix } from './naming';

export interface RuntimeResources {
  secrets: Record<string, secretsmanager.Secret>;
  parameters: Record<string, ssm.StringParameter>;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createRuntimeResources(
  scope: Construct,
  config: ResolvedInfraConfig,
  instanceRole: iam.IRole,
): RuntimeResources {
  const secrets: Record<string, secretsmanager.Secret> = {};
  const parameters: Record<string, ssm.StringParameter> = {};

  config.runtime.secrets.forEach((name, index) => {
    const normalizedName = slugify(name);
    const secret = new secretsmanager.Secret(scope, `RuntimeSecret${index + 1}`, {
      secretName: `${runtimeSecretPrefix(config)}/${normalizedName}`,
      description: `Runtime secret placeholder for ${config.app.name}: ${name}`,
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 32,
      },
    });
    secret.grantRead(instanceRole);
    secrets[name] = secret;
  });

  Object.entries(config.runtime.parameters).forEach(([name, value], index) => {
    const normalizedName = slugify(name);
    const parameter = new ssm.StringParameter(scope, `RuntimeParameter${index + 1}`, {
      parameterName: `${runtimeParameterPrefix(config)}/${normalizedName}`,
      stringValue: value,
      description: `Runtime parameter for ${config.app.name}: ${name}`,
    });
    parameter.grantRead(instanceRole);
    parameters[name] = parameter;
  });

  return {
    secrets,
    parameters,
  };
}