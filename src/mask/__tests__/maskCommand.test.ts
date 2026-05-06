import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runMaskCommand } from '../maskCommand';

function writeTempEnv(content: string): string {
  const tmp = path.join(os.tmpdir(), `stackdiff-mask-${Date.now()}.env`);
  fs.writeFileSync(tmp, content, 'utf8');
  return tmp;
}

describe('runMaskCommand', () => {
  let tmpFile: string;
  let outFile: string;

  beforeEach(() => {
    tmpFile = writeTempEnv(
      'PORT=3000\nAPI_KEY=abc123\nDB_PASSWORD=secret\nAPP_NAME=myapp\n'
    );
    outFile = path.join(os.tmpdir(), `stackdiff-mask-out-${Date.now()}.env`);
  });

  afterEach(() => {
    [tmpFile, outFile].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('masks sensitive keys and writes to output file', async () => {
    await runMaskCommand({ file: tmpFile, output: outFile });
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('PORT=3000');
    expect(content).toContain('APP_NAME=myapp');
    expect(content).toContain('API_KEY=***');
    expect(content).toContain('DB_PASSWORD=***');
  });

  it('respects revealChars option', async () => {
    await runMaskCommand({ file: tmpFile, output: outFile, revealChars: 3 });
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('API_KEY=***123');
  });

  it('masks only specified keys', async () => {
    await runMaskCommand({ file: tmpFile, output: outFile, keys: ['PORT'] });
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('PORT=***');
    expect(content).toContain('API_KEY=abc123');
  });

  it('list-only mode prints masked keys without writing', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runMaskCommand({ file: tmpFile, listOnly: true });
    const output = spy.mock.calls.flat().join('\n');
    expect(output).toContain('API_KEY');
    expect(output).toContain('DB_PASSWORD');
    expect(fs.existsSync(outFile)).toBe(false);
    spy.mockRestore();
  });

  it('throws if no source provided', async () => {
    await expect(runMaskCommand({})).rejects.toThrow('Provide --file');
  });
});
