export type EnvMap = Record<string, string>;

export interface FilterResult {
  result: EnvMap;
  included: string[];
  excluded: string[];
}

/**
 * Returns true if key matches a glob-style pattern.
 * Supports '*' as wildcard.
 */
export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return key.startsWith(prefix);
  }
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1);
    return key.endsWith(suffix);
  }
  return key === pattern;
}

/**
 * Returns true if key matches any of the given patterns.
 */
export function keyMatchesAny(key: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesPattern(key, p));
}

/**
 * Filters an EnvMap by include/exclude patterns.
 * Include patterns take priority: if provided, only matching keys are kept.
 * Exclude patterns then remove keys from the result.
 * If neither is provided, all keys are included.
 */
export function filterEnvMap(
  envMap: EnvMap,
  includePatterns: string[] = [],
  excludePatterns: string[] = []
): FilterResult {
  const allKeys = Object.keys(envMap);

  let candidateKeys: string[];

  if (includePatterns.length > 0) {
    candidateKeys = allKeys.filter((k) => keyMatchesAny(k, includePatterns));
  } else {
    candidateKeys = [...allKeys];
  }

  const includedKeys = candidateKeys.filter(
    (k) => excludePatterns.length === 0 || !keyMatchesAny(k, excludePatterns)
  );

  const excludedKeys = allKeys.filter((k) => !includedKeys.includes(k));

  const result: EnvMap = {};
  for (const key of includedKeys) {
    result[key] = envMap[key];
  }

  return { result, included: includedKeys, excluded: excludedKeys };
}

export function formatFilterSummary(included: string[], excluded: string[]): string {
  const lines: string[] = [
    `Filter summary:`,
    `  Included: ${included.length} key(s)`,
    `  Excluded: ${excluded.length} key(s)`,
  ];
  if (excluded.length > 0) {
    lines.push(`  Excluded keys: ${excluded.join(', ')}`);
  }
  return lines.join('\n');
}
