import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile, parseEnvString } from '../parser';

export type EnvMap = Record<string, string>;

export interface LoadResult {
  source: string;
  map: EnvMap;
  error?: string;
}

export function loadFromFile(filePath: string): LoadResult {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return { source: filePath, map: {}, error: `File not found: ${resolved}` };
  }
  try {
    const map = parseEnvFile(resolved);
    return { source: filePath, map };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { source: filePath, map: {}, error: `Failed to parse ${filePath}: ${message}` };
  }
}

export function loadFromString(content: string, label = 'inline'): LoadResult {
  try {
    const map = parseEnvString(content);
    return { source: label, map };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { source: label, map: {}, error: `Failed to parse inline content: ${message}` };
  }
}

export function loadFromEnv(prefix?: string): LoadResult {
  const map: EnvMap = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (!prefix || key.startsWith(prefix)) {
      const normalizedKey = prefix ? key.slice(prefix.length) : key;
      map[normalizedKey] = value;
    }
  }
  return { source: prefix ? `process.env[${prefix}*]` : 'process.env', map };
}
