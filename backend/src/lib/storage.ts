import { createReadStream, type ReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads');

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
    const absolute = resolveAbsolute(storageKey);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, buffer);
    return { storageKey };
  },

  async stat(storageKey: string): Promise<{ exists: boolean; size: number }> {
    try {
      const info = await stat(resolveAbsolute(storageKey));
      return { exists: info.isFile(), size: info.size };
    } catch {
      return { exists: false, size: 0 };
    }
  },

  createReadStream(storageKey: string): ReadStream {
    return createReadStream(resolveAbsolute(storageKey));
  },

  async remove(storageKey: string): Promise<void> {
    await rm(resolveAbsolute(storageKey), { force: true });
  },
};
