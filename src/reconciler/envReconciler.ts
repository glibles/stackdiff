import { EnvMap } from '../parser';
import { DiffResult } from '../diff';

export type ReconcileStrategy = 'use-source' | 'use-target' | 'interactive';

export interface ReconcileOptions {
  strategy: ReconcileStrategy;
  omitMissing?: boolean;
}

export interface ReconcileResult {
  reconciled: EnvMap;
  applied: string[];
  skipped: string[];
}

/**
 * Merges source into target based on the given diff and strategy.
 * 'use-source' => all source values win for added/modified keys
 * 'use-target' => target is kept as-is for conflicts; missing keys from source are added
 * omitMissing  => keys present in target but missing in source are dropped
 */
export function reconcileEnvMaps(
  source: EnvMap,
  target: EnvMap,
  diff: DiffResult,
  options: ReconcileOptions
): ReconcileResult {
  const { strategy, omitMissing = false } = options;
  const reconciled: EnvMap = { ...target };
  const applied: string[] = [];
  const skipped: string[] = [];

  // Handle keys added in source (missing in target)
  for (const key of diff.added) {
    reconciled[key] = source[key];
    applied.push(key);
  }

  // Handle modified keys
  for (const key of diff.modified) {
    if (strategy === 'use-source') {
      reconciled[key] = source[key];
      applied.push(key);
    } else {
      // use-target: keep existing target value
      skipped.push(key);
    }
  }

  // Handle keys removed from source (present only in target)
  for (const key of diff.removed) {
    if (omitMissing) {
      delete reconciled[key];
      applied.push(key);
    } else {
      skipped.push(key);
    }
  }

  return { reconciled, applied, skipped };
}

export function serializeEnvMap(env: EnvMap): string {
  return Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const needsQuotes = /\s|#|"/.test(value);
      return needsQuotes ? `${key}="${value.replace(/"/g, '\\"')}"` : `${key}=${value}`;
    })
    .join('\n') + '\n';
}
