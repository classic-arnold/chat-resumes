import { ResolvedInfraConfig } from './config';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resourceName(
  config: ResolvedInfraConfig,
  suffix: string,
  maxLength = 63,
): string {
  const candidate = normalize(`${config.app.slug}-${config.app.stage}-${suffix}`);
  const trimmed = candidate.slice(0, maxLength);
  return trimmed.replace(/-+$/g, '');
}

export function parameterPrefix(config: ResolvedInfraConfig): string {
  return `/products/${config.app.slug}/${config.app.stage}`;
}

export function runtimeParameterPrefix(
  config: ResolvedInfraConfig,
  service = config.runtime.service,
): string {
  return `${parameterPrefix(config)}/runtime/${normalize(service)}`;
}

export function runtimeSecretPrefix(
  config: ResolvedInfraConfig,
  service = config.runtime.service,
): string {
  return `${parameterPrefix(config)}/secrets/${normalize(service)}`;
}

export function dedicatedBucketName(config: ResolvedInfraConfig): string {
  return resourceName(
    config,
    `${config.app.account}-${config.app.region}-assets`,
    63,
  );
}

export function configKeyName(value: string): string {
  return normalize(value).replace(/-/g, '_');
}