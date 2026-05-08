import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runFilterCommand } from '../filterCommand';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-filter-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('runFilterCommand', () => {
  let inputFile: string;
  let outputFile: string;

  beforeEach(() => {
    inputFile = writeTempEnv(
      'AWS_KEY=123\nAWS_SECRET=abc\nDB_HOST=localhost\nDB_PASS=secret\nPORT=3000\n'
    );
    outputFile = path.join(os.tmpdir(), `stackdiff-filter-out-${Date.now()}.env`);
  });

  afterEach(() => {
    [inputFile, outputFile].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('writes filtered output to file with include pattern', async () => {
    await runFilterCommand({
      input: inputFile,
      output: outputFile,
      include: ['AWS_*'],
      silent: true,
    });
    const out = fs.readFileSync(outputFile, 'utf-8');
    expect(out).toContain('AWS_KEY=123');
    expect(out).toContain('AWS_SECRET=abc');
    expect(out).not.toContain('DB_HOST');
    expect(out).not.toContain('PORT');
  });

  it('writes filtered output with exclude pattern', async () => {
    await runFilterCommand({
      input: inputFile,
      output: outputFile,
      exclude: ['DB_*'],
      silent: true,
    });
    const out = fs.readFileSync(outputFile, 'utf-8');
    expect(out).not.toContain('DB_HOST');
    expect(out).not.toContain('DB_PASS');
    expect(out).toContain('AWS_KEY=123');
    expect(out).toContain('PORT=3000');
  });

  it('filters by prefix shorthand', async () => {
    await runFilterCommand({
      input: inputFile,
      output: outputFile,
      prefix: 'DB_',
      silent: true,
    });
    const out = fs.readFileSync(outputFile, 'utf-8');
    expect(out).toContain('DB_HOST=localhost');
    expect(out).toContain('DB_PASS=secret');
    expect(out).not.toContain('AWS_KEY');
  });

  it('prints summary when not silent', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runFilterCommand({ input: inputFile, output: outputFile, include: ['PORT'] });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Filter summary'));
    spy.mockRestore();
  });
});
