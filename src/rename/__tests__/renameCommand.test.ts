import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runRenameCommand } from '../renameCommand';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-rename-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('runRenameCommand', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renames a key and writes to the same file by default', async () => {
    const file = writeTempEnv('OLD_KEY=hello\nPORT=3000\n');
    await runRenameCommand({ file, rules: ['OLD_KEY=NEW_KEY'], quiet: true });
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('NEW_KEY=hello');
    expect(content).not.toContain('OLD_KEY=');
    fs.unlinkSync(file);
  });

  it('writes to a separate output file when --output is provided', async () => {
    const file = writeTempEnv('FOO=bar\n');
    const out = path.join(os.tmpdir(), `stackdiff-rename-out-${Date.now()}.env`);
    await runRenameCommand({ file, rules: ['FOO=BAZ'], output: out, quiet: true });
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('BAZ=bar');
    expect(fs.readFileSync(file, 'utf-8')).toContain('FOO=bar');
    fs.unlinkSync(file);
    fs.unlinkSync(out);
  });

  it('does not write files in dry-run mode', async () => {
    const file = writeTempEnv('A=1\n');
    const originalContent = fs.readFileSync(file, 'utf-8');
    await runRenameCommand({ file, rules: ['A=B'], dryRun: true, quiet: true });
    expect(fs.readFileSync(file, 'utf-8')).toBe(originalContent);
    fs.unlinkSync(file);
  });

  it('exits with error on missing file', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      runRenameCommand({ file: '/nonexistent/.env', rules: ['A=B'], quiet: true })
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error on invalid rule format', async () => {
    const file = writeTempEnv('A=1\n');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      runRenameCommand({ file, rules: ['INVALID_RULE'], quiet: true })
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    fs.unlinkSync(file);
  });

  it('prints summary when not quiet', async () => {
    const file = writeTempEnv('ALPHA=1\n');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runRenameCommand({ file, rules: ['ALPHA=BETA'], quiet: false });
    expect(logSpy).toHaveBeenCalled();
    fs.unlinkSync(file);
  });
});
