import { EnvMap } from '../parser';

export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameResult {
  renamed: RenameRule[];
  skipped: RenameRule[];
  notFound: RenameRule[];
  output: EnvMap;
}

/**
 * Apply rename rules to an EnvMap, returning a new map with keys renamed.
 */
export function renameEnvKeys(env: EnvMap, rules: RenameRule[]): RenameResult {
  const output: EnvMap = { ...env };
  const renamed: RenameRule[] = [];
  const skipped: RenameRule[] = [];
  const notFound: RenameRule[] = [];

  for (const rule of rules) {
    const { from, to } = rule;

    if (!(from in output)) {
      notFound.push(rule);
      continue;
    }

    if (to in output && to !== from) {
      skipped.push(rule);
      continue;
    }

    const value = output[from];
    delete output[from];
    output[to] = value;
    renamed.push(rule);
  }

  return { renamed, skipped, notFound, output };
}

/**
 * Parse rename rules from an array of "FROM=TO" strings.
 */
export function parseRenameRules(pairs: string[]): RenameRule[] {
  return pairs.map((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) {
      throw new Error(`Invalid rename rule "${pair}": expected format FROM=TO`);
    }
    const from = pair.slice(0, idx).trim();
    const to = pair.slice(idx + 1).trim();
    if (!from || !to) {
      throw new Error(`Invalid rename rule "${pair}": FROM and TO must be non-empty`);
    }
    return { from, to };
  });
}

/**
 * Format a human-readable summary of the rename operation.
 */
export function formatRenameSummary(result: RenameResult): string {
  const lines: string[] = [];

  if (result.renamed.length > 0) {
    lines.push(`Renamed (${result.renamed.length}):`);
    for (const r of result.renamed) {
      lines.push(`  ${r.from} → ${r.to}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push(`Skipped — target key already exists (${result.skipped.length}):`);
    for (const r of result.skipped) {
      lines.push(`  ${r.from} → ${r.to}`);
    }
  }

  if (result.notFound.length > 0) {
    lines.push(`Not found (${result.notFound.length}):`);
    for (const r of result.notFound) {
      lines.push(`  ${r.from}`);
    }
  }

  if (lines.length === 0) {
    lines.push('No rename rules applied.');
  }

  return lines.join('\n');
}
