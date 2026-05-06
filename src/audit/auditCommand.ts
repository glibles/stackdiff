import { loadFromFile, loadFromEnv } from '../loader';
import { auditEnvMap, formatAuditReport, AuditReport } from './envAudit';

export interface AuditCommandOptions {
  file?: string;
  fromEnv?: boolean;
  label?: string;
  json?: boolean;
}

export interface AuditCommandResult {
  report: AuditReport;
  output: string;
  exitCode: number;
}

export async function runAuditCommand(options: AuditCommandOptions): Promise<AuditCommandResult> {
  const label = options.label ?? (options.file ?? 'env');

  let env: Record<string, string>;
  if (options.fromEnv) {
    env = loadFromEnv();
  } else if (options.file) {
    env = await loadFromFile(options.file);
  } else {
    throw new Error('Provide --file <path> or --from-env to specify the environment source.');
  }

  const report = auditEnvMap(env);

  let output: string;
  if (options.json) {
    output = JSON.stringify(
      {
        label,
        issueCount: report.entries.length,
        hasErrors: report.hasErrors,
        hasWarnings: report.hasWarnings,
        entries: report.entries,
      },
      null,
      2
    );
  } else {
    output = formatAuditReport(report, label);
  }

  const exitCode = report.hasErrors ? 1 : 0;
  return { report, output, exitCode };
}
