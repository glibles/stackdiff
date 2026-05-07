import { EnvMap } from '../parser';

export type FilterMode = 'include' | 'exclude';

export interface FilterOptions {
  patterns: string[];
  mode: FilterMode;
  caseSensitive?: boolean;
}

/**
 * Tests whether a key matches any of the given glob-style patterns.
 * Supports * as a wildcard.
 */
export function matchesPattern(key: string, pattern: string, caseSensitive = true): boolean {
  const k = caseSensitive ? key : key.toUpperCase();
  const p = caseSensitive ? pattern : pattern.toUpperCase();
  const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(k);
}

/**
 * Returns true if the key matches at least one pattern in the list.
 */
export function keyMatchesAny(key: string, patterns: string[], caseSensitive = true): boolean {
  return patterns.some((p) => matchesPattern(key, p, caseSensitive));
}

/**
 * Filters an EnvMap based on include/exclude patterns.
 */
export function filterEnvMap(env: EnvMap, options: FilterOptions): EnvMap {
  const { patterns, mode, caseSensitive = true } = options;
  const result: EnvMap = {};

  for (const [key, value] of Object.entries(env)) {
    const matches = keyMatchesAny(key, patterns, caseSensitive);
    const keep = mode === 'include' ? matches : !matches;
    if (keep) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Returns a human-readable summary of the filter operation.
 */
export function formatFilterSummary(original: EnvMap, filtered: EnvMap, options: FilterOptions): string {
  const originalCount = Object.keys(original).length;
  const filteredCount = Object.keys(filtered).length;
  const removed = originalCount - filteredCount;
  const lines: string[] = [
    `Filter mode : ${options.mode}`,
    `Patterns    : ${options.patterns.join(', ')}`,
    `Keys before : ${originalCount}`,
    `Keys after  : ${filteredCount}`,
    `Removed     : ${removed}`,
  ];
  return lines.join('\n');
}
