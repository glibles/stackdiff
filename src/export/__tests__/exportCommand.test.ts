import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runExportCommand } from '../exportCommand';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-export-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('runExportCommand', () => {
  let tmpInput: string;
  let tmpOutput: string;

  beforeEach(() => {
    tmpInput = writeTempEnv('FOO=bar\nBAZ=qux\n');
    tmpOutput = path.join(os.tmpdir(), `stackdiff-out-${Date.now()}.txt`);
  });

  afterEach(() => {
    [tmpInput, tmpOutput].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
  });

  it('exports to dotenv format file', async () => {
    await runExportCommand({ input: tmpInput, output: tmpOutput, format: 'dotenv' });
    const content = fs.readFileSync(tmpOutput, 'utf-8');
    expect(content).toContain('FOO=bar');
    expect(content).toContain('BAZ=qux');
  });

  it('exports to json format file', async () => {
    await runExportCommand({ input: tmpInput, output: tmpOutput, format: 'json' });
    const content = fs.readFileSync(tmpOutput, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.FOO).toBe('bar');
  });

  it('exports to stdout when no output specified', async () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await runExportCommand({ input: tmpInput, format: 'shell', includeExports: true });
    expect(spy).toHaveBeenCalled();
    const written = (spy.mock.calls[0][0] as string);
    expect(written).toContain('export FOO="bar"');
    spy.mockRestore();
  });

  it('throws when input file does not exist', async () => {
    await expect(
      runExportCommand({ input: '/nonexistent/.env', format: 'dotenv' })
    ).rejects.toThrow('Input file not found');
  });

  it('throws when neither input nor fromEnv is provided', async () => {
    await expect(
      runExportCommand({ format: 'json' })
    ).rejects.toThrow('Either --input or --from-env must be specified');
  });

  it('sorts keys when sortKeys option is true', async () => {
    await runExportCommand({ input: tmpInput, output: tmpOutput, format: 'dotenv', sortKeys: true });
    const content = fs.readFileSync(tmpOutput, 'utf-8');
    const keys = content.split('\n').filter(Boolean).map(l => l.split('=')[0]);
    expect(keys).toEqual([...keys].sort());
  });
});
