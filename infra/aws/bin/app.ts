import { App, Tags } from 'aws-cdk-lib';

import { AwsApplicationInfrastructureStack } from '../src/aws-template-stack';
import { loadInfraConfig } from '../src/config';

const app = new App();
const configPath =
  app.node.tryGetContext('config') ??
  process.env.CDK_CONFIG_PATH ??
  'config/app.json';

const config = loadInfraConfig(configPath);

const stack = new AwsApplicationInfrastructureStack(
  app,
  `${config.app.slug}-aws-template`,
  config,
  {
    env: {
      account: config.app.account,
      region: config.app.region,
    },
    description: `Reusable AWS CDK template for ${config.app.name}`,
  },
);

Tags.of(stack).add('Product', config.app.slug);
Tags.of(stack).add('Stage', config.app.stage);

for (const [key, value] of Object.entries(config.tags)) {
  Tags.of(stack).add(key, value);
}

app.synth();
