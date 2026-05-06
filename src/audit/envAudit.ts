import { EnvMap } from '../parser';

export type AuditSeverity = 'info' | 'warn' | 'error';

export interface AuditEntry {
  key: string;
  severity: AuditSeverity;
  message: string;
}

export interface AuditReport {
  entries: AuditEntry[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

const SENSITIVE_PATTERNS = /secret|password|passwd|token|api_key|private|credential/i;
const PLACEHOLDER_PATTERNS = /^(todo|fixme|changeme|replace_?me|<.*>|\$\{.*\}|xxx+)$/i;
const EMPTY_VALUE_ALLOWED_KEYS = /^(optional|disabled|off)/i;

export function auditEnvMap(env: EnvMap): AuditReport {
  const entries: AuditEntry[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (value === '' && !EMPTY_VALUE_ALLOWED_KEYS.test(key)) {
      entries.push({ key, severity: 'warn', message: 'Value is empty' });
    }

    if (SENSITIVE_PATTERNS.test(key) && value.length < 16) {
      entries.push({
        key,
        severity: 'warn',
        message: 'Sensitive key has a suspiciously short value (possible placeholder)',
      });
    }

    if (PLACEHOLDER_PATTERNS.test(value)) {
      entries.push({
        key,
        severity: 'error',
        message: `Value looks like a placeholder: "${value}"`,
      });
    }

    if (key !== key.toUpperCase()) {
      entries.push({
        key,
        severity: 'info',
        message: 'Key is not uppercase — convention may be violated',
      });
    }
  }

  return {
    entries,
    hasErrors: entries.some((e) => e.severity === 'error'),
    hasWarnings: entries.some((e) => e.severity === 'warn'),
  };
}

export function formatAuditReport(report: AuditReport, label = 'Audit'): string {
  if (report.entries.length === 0) {
    return `[${label}] No issues found.\n`;
  }

  const lines: string[] = [`[${label}] ${report.entries.length} issue(s) found:`];
  for (const entry of report.entries) {
    lines.push(`  [${entry.severity.toUpperCase()}] ${entry.key}: ${entry.message}`);
  }
  return lines.join('\n') + '\n';
}
