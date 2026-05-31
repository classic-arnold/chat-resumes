import * as fs from 'node:fs';
import * as path from 'node:path';

export type AppStage = 'validation-tool' | 'mvp' | 'growth';
export type CertificateMode = 'none' | 'create-dns-validated' | 'import';
export type DeploymentMode = 'in-place' | 'blue-green-placeholder';
export type DataStoreKind = 'none' | 'rds-postgres' | 'documentdb';
export type CacheKind =
  | 'none'
  | 'elasticache-serverless'
  | 'elasticache-replication-group';
export type BucketMode = 'none' | 'shared' | 'dedicated';
export type InstanceSubnetType = 'private' | 'public';

interface RawInfraConfig {
  app?: {
    name?: string;
    slug?: string;
    stage?: AppStage;
    account?: string;
    region?: string;
    port?: number;
    healthCheckPath?: string;
  };
  network?: {
    vpcCidr?: string;
    maxAzs?: number;
    natGateways?: number;
    enableFlowLogs?: boolean;
    instanceSubnetType?: InstanceSubnetType;
  };
  compute?: {
    instanceType?: string;
    minCapacity?: number;
    desiredCapacity?: number;
    maxCapacity?: number;
    rootVolumeGiB?: number;
    enableDetailedMonitoring?: boolean;
    keyPairName?: string;
    requireImdsv2?: boolean;
    ami?: {
      type?: 'amazon-linux-2023' | 'ami-id';
      amiId?: string;
    };
  };
  deployment?: {
    github?: {
      owner?: string;
      repo?: string;
      branch?: string;
      connectionArn?: string;
      pushPaths?: string[];
    };
    build?: {
      buildSpecPath?: string;
      imageTag?: string;
      dockerfilePath?: string;
    };
    codedeploy?: {
      deploymentMode?: DeploymentMode;
      installAgent?: boolean;
    };
    ecr?: {
      repositoryName?: string;
      imageTagMutability?: 'mutable' | 'immutable';
    };
  };
  domain?: {
    enabled?: boolean;
    domainName?: string;
    hostedZoneDomain?: string;
    hostedZoneId?: string;
    recordName?: string;
    certificateMode?: CertificateMode;
    certificateArn?: string;
    createAliasRecord?: boolean;
  };
  runtime?: {
    service?: string;
    secrets?: string[];
    parameters?: Record<string, string>;
  };
  storage?: {
    appBucketMode?: BucketMode;
    sharedBucketName?: string;
    dedicatedBucketName?: string;
  };
  data?: {
    datastore?: DataStoreKind;
    cache?: CacheKind;
    backupRetentionDays?: number;
    multiAz?: boolean;
  };
  monitoring?: {
    enableBasicAlarms?: boolean;
  };
  tags?: Record<string, string>;
}

interface StagePreset {
  instanceType: string;
  minCapacity: number;
  desiredCapacity: number;
  maxCapacity: number;
  rootVolumeGiB: number;
  maxAzs: number;
  natGateways: number;
  datastore: DataStoreKind;
  cache: CacheKind;
  backupRetentionDays: number;
}

export interface ResolvedInfraConfig {
  app: {
    name: string;
    slug: string;
    stage: AppStage;
    account: string;
    region: string;
    port: number;
    healthCheckPath: string;
  };
  network: {
    vpcCidr: string;
    maxAzs: number;
    natGateways: number;
    enableFlowLogs: boolean;
    instanceSubnetType: InstanceSubnetType;
  };
  compute: {
    instanceType: string;
    minCapacity: number;
    desiredCapacity: number;
    maxCapacity: number;
    rootVolumeGiB: number;
    enableDetailedMonitoring: boolean;
    keyPairName?: string;
    requireImdsv2: boolean;
    ami: {
      type: 'amazon-linux-2023' | 'ami-id';
      amiId?: string;
    };
  };
  deployment: {
    github: {
      owner: string;
      repo: string;
      branch: string;
      connectionArn: string;
      pushPaths?: string[];
    };
    build: {
      buildSpecPath: string;
      imageTag: string;
      dockerfilePath?: string;
    };
    codedeploy: {
      deploymentMode: DeploymentMode;
      installAgent: boolean;
    };
    ecr: {
      repositoryName: string;
      imageTagMutability: 'mutable' | 'immutable';
    };
  };
  domain: {
    enabled: boolean;
    domainName?: string;
    hostedZoneDomain?: string;
    hostedZoneId?: string;
    recordName?: string;
    certificateMode: CertificateMode;
    certificateArn?: string;
    createAliasRecord: boolean;
  };
  runtime: {
    service: string;
    secrets: string[];
    parameters: Record<string, string>;
  };
  storage: {
    appBucketMode: BucketMode;
    sharedBucketName?: string;
    dedicatedBucketName?: string;
  };
  data: {
    datastore: DataStoreKind;
    cache: CacheKind;
    backupRetentionDays: number;
    multiAz: boolean;
  };
  monitoring: {
    enableBasicAlarms: boolean;
  };
  tags: Record<string, string>;
}

const STAGE_PRESETS: Record<AppStage, StagePreset> = {
  'validation-tool': {
    instanceType: 't3.small',
    minCapacity: 1,
    desiredCapacity: 1,
    maxCapacity: 2,
    rootVolumeGiB: 20,
    maxAzs: 2,
    natGateways: 1,
    datastore: 'none',
    cache: 'none',
    backupRetentionDays: 7,
  },
  mvp: {
    instanceType: 't3.medium',
    minCapacity: 1,
    desiredCapacity: 1,
    maxCapacity: 3,
    rootVolumeGiB: 30,
    maxAzs: 2,
    natGateways: 1,
    datastore: 'none',
    cache: 'none',
    backupRetentionDays: 7,
  },
  growth: {
    instanceType: 't3.large',
    minCapacity: 2,
    desiredCapacity: 2,
    maxCapacity: 6,
    rootVolumeGiB: 40,
    maxAzs: 3,
    natGateways: 1,
    datastore: 'none',
    cache: 'none',
    backupRetentionDays: 14,
  },
};

function readConfigFile(configPath: string): RawInfraConfig {
  const resolvedPath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw) as RawInfraConfig;
}

function requireString(value: string | undefined, fieldName: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required config value: ${fieldName}`);
  }

  return value.trim();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function sanitizeDatabaseName(value: string): string {
  const underscored = value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return underscored.replace(/^_+|_+$/g, '').slice(0, 50) || 'appdb';
}

export function deriveRecordName(
  domainName: string | undefined,
  hostedZoneDomain: string | undefined,
): string | undefined {
  if (!domainName || !hostedZoneDomain) {
    return undefined;
  }

  const normalizedDomain = domainName.replace(/\.$/, '');
  const normalizedZone = hostedZoneDomain.replace(/\.$/, '');

  if (normalizedDomain === normalizedZone) {
    return undefined;
  }

  const suffix = `.${normalizedZone}`;
  if (!normalizedDomain.endsWith(suffix)) {
    return undefined;
  }

  return normalizedDomain.slice(0, -suffix.length);
}

export function loadInfraConfig(configPath: string): ResolvedInfraConfig {
  const raw = readConfigFile(configPath);
  const stage = raw.app?.stage ?? 'validation-tool';
  const preset = STAGE_PRESETS[stage];

  const appName = requireString(raw.app?.name, 'app.name');
  const slug = raw.app?.slug ? slugify(raw.app.slug) : slugify(appName);
  const account = requireString(raw.app?.account, 'app.account');
  const region = requireString(raw.app?.region, 'app.region');
  const runtimeService = slugify(raw.runtime?.service ?? 'backend') || 'backend';

  const resolvedConfig: ResolvedInfraConfig = {
    app: {
      name: appName,
      slug,
      stage,
      account,
      region,
      port: raw.app?.port ?? 3000,
      healthCheckPath: raw.app?.healthCheckPath ?? '/health',
    },
    network: {
      vpcCidr: raw.network?.vpcCidr ?? '10.0.0.0/16',
      maxAzs: raw.network?.maxAzs ?? preset.maxAzs,
      natGateways: raw.network?.natGateways ?? preset.natGateways,
      enableFlowLogs: raw.network?.enableFlowLogs ?? false,
      instanceSubnetType: raw.network?.instanceSubnetType ?? 'private',
    },
    compute: {
      instanceType: raw.compute?.instanceType ?? preset.instanceType,
      minCapacity: raw.compute?.minCapacity ?? preset.minCapacity,
      desiredCapacity: raw.compute?.desiredCapacity ?? preset.desiredCapacity,
      maxCapacity: raw.compute?.maxCapacity ?? preset.maxCapacity,
      rootVolumeGiB: raw.compute?.rootVolumeGiB ?? preset.rootVolumeGiB,
      enableDetailedMonitoring: raw.compute?.enableDetailedMonitoring ?? false,
      keyPairName: raw.compute?.keyPairName,
      requireImdsv2: raw.compute?.requireImdsv2 ?? true,
      ami: {
        type: raw.compute?.ami?.type ?? 'amazon-linux-2023',
        amiId: raw.compute?.ami?.amiId,
      },
    },
    deployment: {
      github: {
        owner: requireString(raw.deployment?.github?.owner, 'deployment.github.owner'),
        repo: requireString(raw.deployment?.github?.repo, 'deployment.github.repo'),
        branch: requireString(
          raw.deployment?.github?.branch,
          'deployment.github.branch',
        ),
        connectionArn: requireString(
          raw.deployment?.github?.connectionArn,
          'deployment.github.connectionArn',
        ),
        pushPaths: raw.deployment?.github?.pushPaths,
      },
      build: {
        buildSpecPath: requireString(
          raw.deployment?.build?.buildSpecPath,
          'deployment.build.buildSpecPath',
        ),
        imageTag: raw.deployment?.build?.imageTag ?? 'latest',
        dockerfilePath: raw.deployment?.build?.dockerfilePath,
      },
      codedeploy: {
        deploymentMode: raw.deployment?.codedeploy?.deploymentMode ?? 'in-place',
        installAgent: raw.deployment?.codedeploy?.installAgent ?? true,
      },
      ecr: {
        repositoryName: raw.deployment?.ecr?.repositoryName ?? slug,
        imageTagMutability:
          raw.deployment?.ecr?.imageTagMutability ?? 'mutable',
      },
    },
    domain: {
      enabled: raw.domain?.enabled ?? false,
      domainName: raw.domain?.domainName,
      hostedZoneDomain: raw.domain?.hostedZoneDomain,
      hostedZoneId: raw.domain?.hostedZoneId,
      recordName: raw.domain?.recordName,
      certificateMode: raw.domain?.enabled
        ? raw.domain?.certificateMode ?? 'create-dns-validated'
        : 'none',
      certificateArn: raw.domain?.certificateArn,
      createAliasRecord: raw.domain?.createAliasRecord ?? (raw.domain?.enabled ?? false),
    },
    runtime: {
      service: runtimeService,
      secrets: raw.runtime?.secrets ?? [],
      parameters: raw.runtime?.parameters ?? {},
    },
    storage: {
      appBucketMode: raw.storage?.appBucketMode ?? 'none',
      sharedBucketName: raw.storage?.sharedBucketName,
      dedicatedBucketName: raw.storage?.dedicatedBucketName,
    },
    data: {
      datastore: raw.data?.datastore ?? preset.datastore,
      cache: raw.data?.cache ?? preset.cache,
      backupRetentionDays:
        raw.data?.backupRetentionDays ?? preset.backupRetentionDays,
      multiAz: raw.data?.multiAz ?? stage === 'growth',
    },
    monitoring: {
      enableBasicAlarms: raw.monitoring?.enableBasicAlarms ?? true,
    },
    tags: {
      ManagedBy: 'product-factory-template',
      ...raw.tags,
    },
  };

  if (
    resolvedConfig.compute.ami.type === 'ami-id' &&
    !resolvedConfig.compute.ami.amiId
  ) {
    throw new Error('compute.ami.amiId is required when compute.ami.type is "ami-id"');
  }

  if (resolvedConfig.domain.enabled) {
    requireString(resolvedConfig.domain.domainName, 'domain.domainName');

    if (resolvedConfig.domain.certificateMode === 'create-dns-validated') {
      requireString(
        resolvedConfig.domain.hostedZoneDomain,
        'domain.hostedZoneDomain',
      );
    }

    if (resolvedConfig.domain.certificateMode === 'import') {
      requireString(resolvedConfig.domain.certificateArn, 'domain.certificateArn');
    }

    if (!resolvedConfig.domain.recordName) {
      resolvedConfig.domain.recordName = deriveRecordName(
        resolvedConfig.domain.domainName,
        resolvedConfig.domain.hostedZoneDomain,
      );
    }
  }

  if (
    resolvedConfig.storage.appBucketMode === 'shared' &&
    !resolvedConfig.storage.sharedBucketName
  ) {
    throw new Error(
      'storage.sharedBucketName is required when storage.appBucketMode is "shared"',
    );
  }

  return resolvedConfig;
}
