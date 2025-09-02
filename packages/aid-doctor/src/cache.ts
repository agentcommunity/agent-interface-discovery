import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface CacheEntry {
  lastSeen: string;
  pka: string | null;
  kid: string | null;
  hash?: string | null;
}

export interface CacheShape {
  [domain: string]: CacheEntry;
}

function cachePath(): string {
  return path.join(os.homedir(), '.aid', 'cache.json');
}

export async function loadCache(): Promise<CacheShape> {
  try {
    const p = cachePath();
    const data = await fs.readFile(p, 'utf8');
    return JSON.parse(data) as CacheShape;
  } catch {
    return {} as CacheShape;
  }
}

async function ensureDir(filePath: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  } catch {
    // ignore
  }
}

export async function saveCache(cache: CacheShape): Promise<void> {
  const p = cachePath();
  await ensureDir(p);
  const tmp = p + '.tmp';
  const content = JSON.stringify(cache, null, 2);
  await fs.writeFile(tmp, content, { mode: 0o600 });
  await fs.rename(tmp, p);
}
