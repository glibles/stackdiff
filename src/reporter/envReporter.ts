import type { EnvDiffResult, DiffEntry } from '../diff/envDiff';

export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  format?: ReportFormat;
  color?: boolean;
}

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function colorize(text: string, code: string, useColor: boolean): string {
  return useColor ? `${code}${text}${ANSI.reset}` : text;
}

function formatEntry(entry: DiffEntry, useColor: boolean): string {
  switch (entry.type) {
    case 'added':
      return colorize(`+ ${entry.key}=${entry.rightValue}`, ANSI.green, useColor);
    case 'removed':
      return colorize(`- ${entry.key}=${entry.leftValue}`, ANSI.red, useColor);
    case 'changed':
      return [
        colorize(`~ ${entry.key}`, ANSI.yellow, useColor),
        colorize(`  - ${entry.leftValue}`, ANSI.red, useColor),
        colorize(`  + ${entry.rightValue}`, ANSI.green, useColor),
      ].join('\n');
    default:
      return `  ${entry.key}=${entry.leftValue}`;
  }
}

/**
 * Returns a summary line counting added, removed, and changed entries.
 */
function formatSummary(entries: DiffEntry[], useColor: boolean): string {
  const added = entries.filter((e) => e.type === 'added').length;
  const removed = entries.filter((e) => e.type === 'removed').length;
  const changed = entries.filter((e) => e.type === 'changed').length;
  const parts = [
    colorize(`+${added}`, ANSI.green, useColor),
    colorize(`-${removed}`, ANSI.red, useColor),
    colorize(`~${changed}`, ANSI.yellow, useColor),
  ];
  return parts.join('  ');
}

export function renderTextReport(
  result: EnvDiffResult,
  options: ReportOptions = {}
): string {
  const useColor = options.color ?? process.stdout.isTTY ?? false;
  const lines: string[] = [];

  if (result.entries.length === 0) {
    return colorize('No differences found.', ANSI.bold, useColor);
  }

  const header = colorize(
    `Diff: ${result.entries.length} difference(s) found`,
    ANSI.bold,
    useColor
  );
  lines.push(header);
  lines.push(formatSummary(result.entries, useColor));
  lines.push('');

  for (const entry of result.entries) {
    lines.push(formatEntry(entry, useColor));
  }

  return lines.join('\n');
}

export function renderReport(
  result: EnvDiffResult,
  options: ReportOptions = {}
): string {
  const format = options.format ?? 'text';
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  return renderTextReport(result, options);
}
