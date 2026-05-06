import { EnvMap } from '../parser';

export type MergeStrategy = 'ours' | 'theirs' | 'interactive' | 'union';

export interface MergeOptions {
  strategy: MergeStrategy;
  overwriteExisting?: boolean;
}

export interface MergeResult {
  merged: EnvMap;
  conflicts: string[];
  added: string[];
  overwritten: string[];
}

/**
 * Merges two EnvMaps (base and incoming) according to the given strategy.
 * - 'ours':   keep base values on conflict
 * - 'theirs': take incoming values on conflict
 * - 'union':  include all keys; prefer incoming when both exist
 */
export function mergeEnvMaps(
  base: EnvMap,
  incoming: EnvMap,
  options: MergeOptions = { strategy: 'ours' }
): MergeResult {
  const merged: EnvMap = { ...base };
  const conflicts: string[] = [];
  const added: string[] = [];
  const overwritten: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (base[key] !== value) {
      conflicts.push(key);
      if (options.strategy === 'theirs' || options.strategy === 'union') {
        merged[key] = value;
        overwritten.push(key);
      }
      // 'ours' keeps base value — no action needed
    }
  }

  return { merged, conflicts, added, overwritten };
}

/**
 * Returns a human-readable summary of a MergeResult.
 */
export function formatMergeSummary(result: MergeResult): string {
  const lines: string[] = [];
  lines.push(`Added:      ${result.added.length} key(s)`);
  lines.push(`Conflicts:  ${result.conflicts.length} key(s)`);
  lines.push(`Overwritten:${result.overwritten.length} key(s)`);
  if (result.conflicts.length > 0) {
    lines.push('Conflict keys: ' + result.conflicts.join(', '));
  }
  return lines.join('\n');
}
