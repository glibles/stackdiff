import * as fs from 'fs';
import * as path from 'path';
import { EnvMap } from '../parser';

export interface Snapshot {
  label: string;
  timestamp: string;
  target: string;
  env: EnvMap;
}

export function createSnapshot(label: string, target: string, env: EnvMap): Snapshot {
  return {
    label,
    timestamp: new Date().toISOString(),
    target,
    env,
  };
}

export function saveSnapshot(snapshot: Snapshot, dir: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${snapshot.target}-${snapshot.label}-${Date.now()}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot file not found: ${filepath}`);
  }
  const raw = fs.readFileSync(filepath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed.label || !parsed.timestamp || !parsed.target || !parsed.env) {
    throw new Error(`Invalid snapshot format in: ${filepath}`);
  }
  return parsed as Snapshot;
}

export function listSnapshots(dir: string): Snapshot[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return loadSnapshot(path.join(dir, f));
      } catch {
        return null;
      }
    })
    .filter((s): s is Snapshot => s !== null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
