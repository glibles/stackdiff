import { EnvMap } from '../parser/envParser';

export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  status: DiffStatus;
  baseValue?: string;
  targetValue?: string;
}

export interface DiffResult {
  entries: DiffEntry[];
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: DiffEntry[];
  unchanged: DiffEntry[];
}

export function diffEnvMaps(base: EnvMap, target: EnvMap): DiffResult {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);

  for (const key of Array.from(allKeys).sort()) {
    const inBase = Object.prototype.hasOwnProperty.call(base, key);
    const inTarget = Object.prototype.hasOwnProperty.call(target, key);

    if (inBase && !inTarget) {
      entries.push({ key, status: 'removed', baseValue: base[key] });
    } else if (!inBase && inTarget) {
      entries.push({ key, status: 'added', targetValue: target[key] });
    } else if (base[key] !== target[key]) {
      entries.push({ key, status: 'changed', baseValue: base[key], targetValue: target[key] });
    } else {
      entries.push({ key, status: 'unchanged', baseValue: base[key], targetValue: target[key] });
    }
  }

  return {
    entries,
    added: entries.filter((e) => e.status === 'added'),
    removed: entries.filter((e) => e.status === 'removed'),
    changed: entries.filter((e) => e.status === 'changed'),
    unchanged: entries.filter((e) => e.status === 'unchanged'),
  };
}

export function hasDifferences(result: DiffResult): boolean {
  return result.added.length > 0 || result.removed.length > 0 || result.changed.length > 0;
}
