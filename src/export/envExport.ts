import { EnvMap } from '../parser';

export type ExportFormat = 'dotenv' | 'json' | 'yaml' | 'shell';

export interface ExportOptions {
  format: ExportFormat;
  includeExports?: boolean;
  sortKeys?: boolean;
  header?: string;
}

function sortedEntries(map: EnvMap, sort: boolean): [string, string][] {
  const entries = Object.entries(map);
  return sort ? entries.sort(([a], [b]) => a.localeCompare(b)) : entries;
}

export function exportAsDotenv(map: EnvMap, options: ExportOptions): string {
  const lines: string[] = [];
  if (options.header) {
    lines.push(`# ${options.header}`);
    lines.push('');
  }
  for (const [key, value] of sortedEntries(map, options.sortKeys ?? false)) {
    const escaped = value.includes(' ') || value.includes('#') ? `"${value}"` : value;
    lines.push(`${key}=${escaped}`);
  }
  return lines.join('\n');
}

export function exportAsJson(map: EnvMap, options: ExportOptions): string {
  const sorted = options.sortKeys
    ? Object.fromEntries(sortedEntries(map, true))
    : map;
  return JSON.stringify(sorted, null, 2);
}

export function exportAsYaml(map: EnvMap, options: ExportOptions): string {
  const lines: string[] = [];
  if (options.header) {
    lines.push(`# ${options.header}`);
  }
  for (const [key, value] of sortedEntries(map, options.sortKeys ?? false)) {
    const escaped = value.includes(':') || value.includes('#') ? `"${value}"` : value;
    lines.push(`${key}: ${escaped}`);
  }
  return lines.join('\n');
}

export function exportAsShell(map: EnvMap, options: ExportOptions): string {
  const lines: string[] = [];
  if (options.header) {
    lines.push(`# ${options.header}`);
    lines.push('');
  }
  const prefix = options.includeExports ? 'export ' : '';
  for (const [key, value] of sortedEntries(map, options.sortKeys ?? false)) {
    const escaped = value.replace(/"/g, '\\"');
    lines.push(`${prefix}${key}="${escaped}"`);
  }
  return lines.join('\n');
}

export function exportEnvMap(map: EnvMap, options: ExportOptions): string {
  switch (options.format) {
    case 'dotenv': return exportAsDotenv(map, options);
    case 'json':   return exportAsJson(map, options);
    case 'yaml':   return exportAsYaml(map, options);
    case 'shell':  return exportAsShell(map, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
