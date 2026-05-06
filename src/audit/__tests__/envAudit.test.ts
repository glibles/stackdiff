import { auditEnvMap, formatAuditReport } from '../envAudit';
import { EnvMap } from '../../parser';

describe('auditEnvMap', () => {
  it('returns no entries for a clean env map', () => {
    const env: EnvMap = { DATABASE_URL: 'postgres://localhost/db', PORT: '3000' };
    const report = auditEnvMap(env);
    expect(report.entries).toHaveLength(0);
    expect(report.hasErrors).toBe(false);
    expect(report.hasWarnings).toBe(false);
  });

  it('warns on empty values for non-optional keys', () => {
    const env: EnvMap = { API_URL: '' };
    const report = auditEnvMap(env);
    expect(report.entries).toContainEqual(
      expect.objectContaining({ key: 'API_URL', severity: 'warn' })
    );
  });

  it('does not warn on empty value for optional-prefixed keys', () => {
    const env: EnvMap = { OPTIONAL_FEATURE: '' };
    const report = auditEnvMap(env);
    expect(report.entries.filter((e) => e.key === 'OPTIONAL_FEATURE')).toHaveLength(0);
  });

  it('warns on sensitive key with short value', () => {
    const env: EnvMap = { API_SECRET: 'short' };
    const report = auditEnvMap(env);
    expect(report.hasWarnings).toBe(true);
    expect(report.entries[0].key).toBe('API_SECRET');
  });

  it('errors on placeholder values', () => {
    const env: EnvMap = { DB_PASSWORD: 'CHANGEME', TOKEN: '<replace_me>' };
    const report = auditEnvMap(env);
    const errorKeys = report.entries
      .filter((e) => e.severity === 'error')
      .map((e) => e.key);
    expect(errorKeys).toContain('DB_PASSWORD');
    expect(errorKeys).toContain('TOKEN');
    expect(report.hasErrors).toBe(true);
  });

  it('flags lowercase keys with info severity', () => {
    const env: EnvMap = { myKey: 'value' };
    const report = auditEnvMap(env);
    expect(report.entries).toContainEqual(
      expect.objectContaining({ key: 'myKey', severity: 'info' })
    );
  });
});

describe('formatAuditReport', () => {
  it('returns clean message when no issues', () => {
    const report = { entries: [], hasErrors: false, hasWarnings: false };
    expect(formatAuditReport(report)).toContain('No issues found');
  });

  it('includes severity and key in output', () => {
    const report = auditEnvMap({ TOKEN: 'xxx' });
    const output = formatAuditReport(report, 'Test');
    expect(output).toContain('[Test]');
    expect(output).toContain('TOKEN');
    expect(output).toContain('ERROR');
  });
});
