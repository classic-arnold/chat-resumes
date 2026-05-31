import 'dotenv/config';

import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue === '' ? undefined : trimmedValue;
  },
  z.string().min(1).optional(),
);

const postgresUrlSchema = z
  .string()
  .min(1, 'DATABASE_URL is required')
  .refine(
    (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    'DATABASE_URL must start with postgresql:// or postgres://',
  );

const clientOriginsSchema = z
  .string()
  .default('http://localhost:5173')
  .transform((value, context) => {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    if (origins.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'CLIENT_ORIGIN must contain at least one URL',
      });
      return z.NEVER;
    }

    for (const origin of origins) {
      if (!z.string().url().safeParse(origin).success) {
        context.addIssue({
          code: 'custom',
          message: `CLIENT_ORIGIN contains an invalid URL: ${origin}`,
        });
        return z.NEVER;
      }
    }

    return origins;
  });

const rawEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_ORIGIN: clientOriginsSchema,
    APP_BASE_URL: z.string().url().default('http://localhost:4000'),
    DATABASE_URL: postgresUrlSchema.default(
      'postgresql://postgres:postgres@localhost:5432/chat_resumes?schema=public',
    ),
    SOCKET_PATH: z.string().min(1).default('/socket.io'),
    AWS_REGION: z.string().min(1).default('us-east-1'),
    STORAGE_BUCKET_NAME: optionalNonEmptyString,
    CLERK_SECRET_KEY: optionalNonEmptyString,
    STRIPE_SECRET_KEY: optionalNonEmptyString,
    STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
    STRIPE_PRICE_ID: optionalNonEmptyString,
    OPENAI_API_KEY: optionalNonEmptyString,
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== 'production') {
      return;
    }

    const requiredInProduction = [
      'CLERK_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID',
      'OPENAI_API_KEY',
    ] as const;

    requiredInProduction.forEach((key) => {
      if (!values[key]) {
        context.addIssue({
          code: 'custom',
          message: `${key} is required in production`,
          path: [key],
        });
      }
    });
  });

const parsedEnv = rawEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `- ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid backend environment variables:\n${issues}`);
}

export const env = Object.freeze({
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  clientOrigin: parsedEnv.data.CLIENT_ORIGIN[0],
  clientOrigins: parsedEnv.data.CLIENT_ORIGIN,
  appBaseUrl: parsedEnv.data.APP_BASE_URL,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  socketPath: parsedEnv.data.SOCKET_PATH,
  awsRegion: parsedEnv.data.AWS_REGION,
  storageBucketName: parsedEnv.data.STORAGE_BUCKET_NAME,
  usesS3Storage: Boolean(parsedEnv.data.STORAGE_BUCKET_NAME),
  clerkSecretKey: parsedEnv.data.CLERK_SECRET_KEY,
  isClerkConfigured: Boolean(parsedEnv.data.CLERK_SECRET_KEY),
  stripeSecretKey: parsedEnv.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.data.STRIPE_WEBHOOK_SECRET,
  stripePriceId: parsedEnv.data.STRIPE_PRICE_ID,
  isStripeCheckoutConfigured: Boolean(
    parsedEnv.data.STRIPE_SECRET_KEY && parsedEnv.data.STRIPE_PRICE_ID,
  ),
  isStripeWebhookConfigured: Boolean(
    parsedEnv.data.STRIPE_SECRET_KEY && parsedEnv.data.STRIPE_WEBHOOK_SECRET,
  ),
  openAiApiKey: parsedEnv.data.OPENAI_API_KEY,
  isProduction: parsedEnv.data.NODE_ENV === 'production',
});

export type Env = typeof env;