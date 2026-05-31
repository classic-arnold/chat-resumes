import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { loadInfraConfig, type ResolvedInfraConfig } from '../src/config';
import { dedicatedBucketName, runtimeParameterPrefix } from '../src/naming';

type ParameterType = 'String' | 'SecureString';

interface ParameterSpec {
  name: string;
  value?: string;
  type: ParameterType;
  required: boolean;
  source: string;
}

const ProductRootMirrorKeys = ['OPENAI_API_KEY'] as const;

type ProductRootMirrorKey = (typeof ProductRootMirrorKeys)[number];

const PlaceholderExactValues = new Set([
  'replace-me',
  'changeme',
  'change-me',
  'fill-me-in',
  'todo',
  'tbd',
]);

const PlaceholderFragments = ['<fill', '.example', 'example.com'];

function parseArgs(argv: string[]) {
  let configPath = process.env.CDK_CONFIG_PATH ?? 'config/app.json';
  let seedPath = 'runtime.env';
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

    if (arg === '--seed') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --seed');
      }

      seedPath = nextValue;
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { configPath, seedPath, dryRun };
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Runtime seed file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const entries: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const delimiterIndex = line.indexOf('=');
    if (delimiterIndex <= 0) {
      continue;
    }

    const key = line.slice(0, delimiterIndex).trim();
    let value = line.slice(delimiterIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function readOptionalEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  return readEnvFile(filePath);
}

function writeEnvOverrides(filePath: string, overrides: Record<string, string>) {
  if (Object.keys(overrides).length === 0) {
    return;
  }

  const original = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const originalHadTrailingNewline = original.endsWith('\n');
  const lines = original.split(/\r?\n/u);
  const seenKeys = new Set<string>();

  const nextLines = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return rawLine;
    }

    const delimiterIndex = trimmed.indexOf('=');
    if (delimiterIndex <= 0) {
      return rawLine;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    const override = overrides[key];

    if (override === undefined) {
      return rawLine;
    }

    seenKeys.add(key);
    return `${key}=${override}`;
  });

  const additions = Object.entries(overrides)
    .filter(([key]) => !seenKeys.has(key))
    .map(([key, value]) => `${key}=${value}`);

  let finalLines = nextLines;
  if (additions.length > 0) {
    if (finalLines.length === 1 && finalLines[0] === '') {
      finalLines = additions;
    } else {
      while (finalLines.length > 0 && finalLines[finalLines.length - 1] === '') {
        finalLines = finalLines.slice(0, -1);
      }
      finalLines = [...finalLines, ...additions];
    }
  }

  const nextContent = `${finalLines.join('\n')}${originalHadTrailingNewline || finalLines.length > 0 ? '\n' : ''}`;
  fs.writeFileSync(filePath, nextContent, 'utf8');
}

function detectPlaceholderReason(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (PlaceholderExactValues.has(normalized)) {
    return `placeholder token \"${value.trim()}\"`;
  }

  const matchedFragment = PlaceholderFragments.find((fragment) => normalized.includes(fragment));
  if (matchedFragment) {
    return `placeholder fragment \"${matchedFragment}\"`;
  }

  return null;
}

function mirrorSharedValuesFromProductEnv(input: {
  seedEntries: Record<string, string>;
  productEnvEntries: Record<string, string>;
  resolvedSeedPath: string;
  productEnvPath: string;
}) {
  const envEntries = { ...input.seedEntries };
  const overrides: Record<string, string> = {};
  const hydratedKeys: ProductRootMirrorKey[] = [];

  for (const key of ProductRootMirrorKeys) {
    const productValue = input.productEnvEntries[key]?.trim();
    if (!productValue) {
      continue;
    }

    const productPlaceholderReason = detectPlaceholderReason(productValue);
    if (productPlaceholderReason) {
      throw new Error(
        `Product root .env value for ${key} in ${input.productEnvPath} looks unresolved (${productPlaceholderReason}).`,
      );
    }

    const seedValue = envEntries[key]?.trim();
    const seedPlaceholderReason = detectPlaceholderReason(seedValue);

    if (!seedValue || seedPlaceholderReason) {
      envEntries[key] = productValue;
      overrides[key] = productValue;
      hydratedKeys.push(key);
      continue;
    }

    if (seedValue !== productValue) {
      throw new Error(
        `Runtime seed ${input.resolvedSeedPath} diverges from canonical product root .env ${input.productEnvPath} for ${key}.`,
      );
    }
  }

  return { envEntries, overrides, hydratedKeys };
}

function buildValueSourceMap(keys: string[], source: string) {
  return Object.fromEntries(keys.map((key) => [key, source])) as Record<string, string>;
}

function validateSpecValues(specs: ParameterSpec[]) {
  for (const spec of specs) {
    if (!spec.value) {
      if (spec.required) {
        throw new Error(`Missing required runtime value for ${spec.name}`);
      }

      continue;
    }

    const placeholderReason = detectPlaceholderReason(spec.value);
    if (placeholderReason) {
      throw new Error(
        `Runtime value for ${spec.name} from ${spec.source} looks unresolved (${placeholderReason}).`,
      );
    }
  }
}

function toParameterLeaf(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .replace(/-{2,}/gu, '-');
}

function resolveStorageBucketName(config: ResolvedInfraConfig) {
  if (config.storage.appBucketMode === 'none') {
    return undefined;
  }

  if (config.storage.appBucketMode === 'shared') {
    return config.storage.sharedBucketName;
  }

  return config.storage.dedicatedBucketName ?? dedicatedBucketName(config);
}

function requireSeedValue(
  envEntries: Record<string, string>,
  key: string,
  usedKeys: Set<string>,
) {
  usedKeys.add(key);
  const value = envEntries[key]?.trim();

  if (!value) {
    throw new Error(`Missing required runtime seed value: ${key}`);
  }

  return value;
}

function optionalSeedValue(
  envEntries: Record<string, string>,
  key: string,
  usedKeys: Set<string>,
) {
  usedKeys.add(key);
  const value = envEntries[key]?.trim();
  return value ? value : undefined;
}

function maskValue(type: ParameterType, value: string | undefined) {
  if (value === undefined) {
    return '<absent>';
  }

  if (type === 'SecureString') {
    return '<secure>';
  }

  return value;
}

function putParameter(region: string, name: string, type: ParameterType, value: string) {
  execFileSync(
    'aws',
    ['ssm', 'put-parameter', '--region', region, '--name', name, '--type', type, '--value', value, '--overwrite'],
    { stdio: 'inherit' },
  );
}

function deleteParameter(region: string, name: string) {
  try {
    execFileSync('aws', ['ssm', 'delete-parameter', '--region', region, '--name', name], {
      stdio: 'inherit',
    });
  } catch {
    // Missing parameters are safe to ignore on cleanup.
  }
}

function warnOnUnknownKeys(envEntries: Record<string, string>, usedKeys: Set<string>) {
  const unknownKeys = Object.keys(envEntries)
    .filter((key) => !usedKeys.has(key))
    .sort();

  if (unknownKeys.length === 0) {
    return;
  }

  process.stderr.write(
    `Ignoring non-runtime keys in seed file: ${unknownKeys.join(', ')}\n`,
  );
}

function main() {
  const { configPath, seedPath, dryRun } = parseArgs(process.argv.slice(2));
  const config = loadInfraConfig(configPath);
  const resolvedSeedPath = path.resolve(process.cwd(), seedPath);
  const productEnvPath = path.resolve(path.dirname(resolvedSeedPath), '..', '..', '.env');
  const seedEntries = readEnvFile(resolvedSeedPath);
  const productEnvEntries = readOptionalEnvFile(productEnvPath);
  const { envEntries, overrides, hydratedKeys } = mirrorSharedValuesFromProductEnv({
    seedEntries,
    productEnvEntries,
    resolvedSeedPath,
    productEnvPath,
  });
  const usedKeys = new Set<string>();
  const sourceOverrides = buildValueSourceMap(
    hydratedKeys,
    `product root .env (${path.relative(process.cwd(), productEnvPath) || '.env'})`,
  );

  if (Object.keys(overrides).length > 0) {
    const actionLabel = dryRun ? 'Would hydrate' : 'Hydrated';
    process.stderr.write(
      `${actionLabel} ${resolvedSeedPath} from ${productEnvPath} for shared keys: ${hydratedKeys.join(', ')}\n`,
    );
  }

  if (!dryRun) {
    writeEnvOverrides(resolvedSeedPath, overrides);
  }

  const nodeEnv = optionalSeedValue(envEntries, 'NODE_ENV', usedKeys) ?? 'production';
  const storageBucketName = resolveStorageBucketName(config);

  if (nodeEnv !== 'production') {
    throw new Error(
      `NODE_ENV must resolve to production for deployed runtime sync. Received: ${nodeEnv}`,
    );
  }

  const specs: ParameterSpec[] = [
    {
      name: 'NODE_ENV',
      value: nodeEnv,
      type: 'String',
      required: true,
      source: envEntries.NODE_ENV ? 'runtime seed' : 'default deployed runtime',
    },
    {
      name: 'PORT',
      value: `${config.app.port}`,
      type: 'String',
      required: true,
      source: 'infra config app.port',
    },
    {
      name: 'CLIENT_ORIGIN',
      value: requireSeedValue(envEntries, 'CLIENT_ORIGIN', usedKeys),
      type: 'String',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'APP_BASE_URL',
      value: requireSeedValue(envEntries, 'APP_BASE_URL', usedKeys),
      type: 'String',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'AWS_REGION',
      value: config.app.region,
      type: 'String',
      required: true,
      source: 'infra config app.region',
    },
    {
      name: 'DATABASE_URL',
      value: requireSeedValue(envEntries, 'DATABASE_URL', usedKeys),
      type: 'SecureString',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'SOCKET_PATH',
      value: optionalSeedValue(envEntries, 'SOCKET_PATH', usedKeys) ?? '/socket.io',
      type: 'String',
      required: false,
      source: 'runtime seed or default',
    },
    {
      name: 'STORAGE_BUCKET_NAME',
      value: storageBucketName,
      type: 'String',
      required: Boolean(storageBucketName),
      source: 'infra config storage',
    },
    {
      name: 'CLERK_SECRET_KEY',
      value: requireSeedValue(envEntries, 'CLERK_SECRET_KEY', usedKeys),
      type: 'SecureString',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'STRIPE_SECRET_KEY',
      value: requireSeedValue(envEntries, 'STRIPE_SECRET_KEY', usedKeys),
      type: 'SecureString',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'STRIPE_WEBHOOK_SECRET',
      value: requireSeedValue(envEntries, 'STRIPE_WEBHOOK_SECRET', usedKeys),
      type: 'SecureString',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'STRIPE_PRICE_ID',
      value: requireSeedValue(envEntries, 'STRIPE_PRICE_ID', usedKeys),
      type: 'String',
      required: true,
      source: 'runtime seed',
    },
    {
      name: 'OPENAI_API_KEY',
      value: requireSeedValue(envEntries, 'OPENAI_API_KEY', usedKeys),
      type: 'SecureString',
      required: true,
      source: sourceOverrides.OPENAI_API_KEY ?? 'runtime seed',
    },
  ];

  validateSpecValues(specs);

  warnOnUnknownKeys(envEntries, usedKeys);

  const prefix = runtimeParameterPrefix(config);

  for (const spec of specs) {
    const parameterName = `${prefix}/${toParameterLeaf(spec.name)}`;

    if (dryRun) {
      process.stdout.write(
        `${parameterName} (${spec.type}) <- ${spec.source}: ${maskValue(spec.type, spec.value)}\n`,
      );
      continue;
    }

    if (!spec.value) {
      if (spec.required) {
        throw new Error(`Missing required runtime value for ${spec.name}`);
      }

      deleteParameter(config.app.region, parameterName);
      process.stdout.write(`Removed ${parameterName}\n`);
      continue;
    }

    putParameter(config.app.region, parameterName, spec.type, spec.value);
    process.stdout.write(`Synced ${parameterName}\n`);
  }
}

main();