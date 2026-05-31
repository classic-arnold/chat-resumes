import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { env } from '../config/env.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads');
const s3Client = env.usesS3Storage
  ? new S3Client({ region: env.awsRegion })
  : null;

const sanitizeName = (name: string) => {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'upload';
};

const resolveAbsolute = (storageKey: string) => {
  const absolute = path.resolve(STORAGE_ROOT, storageKey);

  if (!absolute.startsWith(STORAGE_ROOT + path.sep) && absolute !== STORAGE_ROOT) {
    throw new Error('Refusing to access path outside storage root.');
  }

  return absolute;
};

const resolveBucketName = () => {
  if (!env.storageBucketName) {
    throw new Error('S3 storage is not configured.');
  }

  return env.storageBucketName;
};

const resolveS3Client = () => {
  if (!s3Client) {
    throw new Error('S3 storage is not configured.');
  }

  return s3Client;
};

const toNodeReadable = (body: unknown) => {
  if (body instanceof Readable) {
    return body;
  }

  if (
    body &&
    typeof body === 'object' &&
    'transformToWebStream' in body &&
    typeof body.transformToWebStream === 'function'
  ) {
    return Readable.fromWeb(body.transformToWebStream());
  }

  if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
    return Readable.from(body);
  }

  throw new Error('Storage object body is not streamable.');
};

export const storage = {
  async put({
    buffer,
    originalName,
    userId,
  }: {
    buffer: Buffer;
    originalName: string;
    userId: string;
  }): Promise<{ storageKey: string }> {
    const safeName = sanitizeName(originalName);
    const storageKey = path.posix.join(userId, `${randomUUID()}-${safeName}`);

    if (env.usesS3Storage) {
      await resolveS3Client().send(
        new PutObjectCommand({
          Bucket: resolveBucketName(),
          Key: storageKey,
          Body: buffer,
        }),
      );

      return { storageKey };
    }

    const absolute = resolveAbsolute(storageKey);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, buffer);
    return { storageKey };
  },

  async stat(storageKey: string): Promise<{ exists: boolean; size: number }> {
    if (env.usesS3Storage) {
      try {
        const response = await resolveS3Client().send(
          new HeadObjectCommand({
            Bucket: resolveBucketName(),
            Key: storageKey,
          }),
        );

        return {
          exists: true,
          size: response.ContentLength ?? 0,
        };
      } catch {
        return { exists: false, size: 0 };
      }
    }

    try {
      const info = await stat(resolveAbsolute(storageKey));
      return { exists: info.isFile(), size: info.size };
    } catch {
      return { exists: false, size: 0 };
    }
  },

  async createReadStream(storageKey: string): Promise<Readable> {
    if (env.usesS3Storage) {
      const response = await resolveS3Client().send(
        new GetObjectCommand({
          Bucket: resolveBucketName(),
          Key: storageKey,
        }),
      );

      if (!response.Body) {
        throw new Error(`Storage object ${storageKey} has no readable body.`);
      }

      return toNodeReadable(response.Body);
    }

    return createReadStream(resolveAbsolute(storageKey));
  },

  async remove(storageKey: string): Promise<void> {
    if (env.usesS3Storage) {
      await resolveS3Client().send(
        new DeleteObjectCommand({
          Bucket: resolveBucketName(),
          Key: storageKey,
        }),
      );

      return;
    }

    await rm(resolveAbsolute(storageKey), { force: true });
  },
};
