import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runAuditCommand } from '../auditCommand';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-audit-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('runAuditCommand', () => {
  it('throws when no source is provided', async () => {
    await expect(runAuditCommand({})).rejects.toThrow();
  });

  it('returns exitCode 0 for a clean file', async () => {
    const file = writeTempEnv('DATABASE_URL=postgres://localhost/db\nPORT=3000\n');
    const result = await runAuditCommand({ file });
    expect(result.exitCode).toBe(0);
    expect(result.report.hasErrors).toBe(false);
    fs.unlinkSync(file);
  });

  it('returns exitCode 1 when placeholders are present', async () => {
    const file = writeTempEnv('SECRET=CHANGEME\n');
    const result = await runAuditCommand({ file });
    expect(result.exitCode).toBe(1);
    expect(result.report.hasErrors).toBe(true);
    fs.unlinkSync(file);
  });

  it('outputs JSON when json option is set', async () => {
    const file = writeTempEnv('PORT=8080\n');
    const result = await runAuditCommand({ file, json: true });
    const parsed = JSON.parse(result.output);
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('hasErrors');
    fs.unlinkSync(file);
  });

  it('uses label in text output', async () => {
    const file = writeTempEnv('PORT=8080\n');
    const result = await runAuditCommand({ file, label: 'production' });
    expect(result.output).toContain('production');
    fs.unlinkSync(file);
  });

  it('loads from process.env when fromEnv is true', async () => {
    process.env.__AUDIT_TEST__ = 'hello';
    const result = await runAuditCommand({ fromEnv: true });
    expect(result.report).toBeDefined();
    delete process.env.__AUDIT_TEST__;
  });
});
