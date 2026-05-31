import { execFileSync } from 'node:child_process';

import { loadInfraConfig } from '../src/config';
import { resourceName } from '../src/naming';

function parseArgs(argv: string[]) {
  let configPath = process.env.CDK_CONFIG_PATH ?? 'config/app.json';
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--config') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --config');
      }

      configPath = nextValue;
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { configPath, dryRun };
}

function readJsonCommand(command: string[]) {
  const output = execFileSync(command[0], command.slice(1), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  return JSON.parse(output) as Record<string, unknown>;
}

function isPipelineExecutionActive(status: unknown) {
  return status === 'InProgress' || status === 'Stopping';
}

function main() {
  const { configPath, dryRun } = parseArgs(process.argv.slice(2));
  const config = loadInfraConfig(configPath);
  const pipelineName = resourceName(config, 'pipeline', 100);
  const startCommand = [
    'aws',
    'codepipeline',
    'start-pipeline-execution',
    '--name',
    pipelineName,
    '--region',
    config.app.region,
    '--output',
    'json',
  ];

  if (dryRun) {
    process.stdout.write(
      `aws codepipeline list-pipeline-executions --pipeline-name ${pipelineName} --max-results 1 --region ${config.app.region} --output json\n`,
    );
    process.stdout.write(`${startCommand.join(' ')}\n`);
    return;
  }

  const executionSummary = readJsonCommand([
    'aws',
    'codepipeline',
    'list-pipeline-executions',
    '--pipeline-name',
    pipelineName,
    '--max-results',
    '1',
    '--region',
    config.app.region,
    '--output',
    'json',
  ]);
  const latestSummary = Array.isArray(executionSummary.pipelineExecutionSummaries)
    ? executionSummary.pipelineExecutionSummaries[0]
    : undefined;
  const latestStatus =
    latestSummary && typeof latestSummary === 'object'
      ? latestSummary.status
      : undefined;

  if (isPipelineExecutionActive(latestStatus)) {
    process.stdout.write(
      JSON.stringify(
        {
          skipped: true,
          pipelineName,
          reason: `latest pipeline execution is already ${String(latestStatus)}`,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
    return;
  }

  const output = execFileSync(startCommand[0], startCommand.slice(1), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  process.stdout.write(output);
}

main();