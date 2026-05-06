import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runMergeCommand } from '../mergeCommand';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-merge-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('runMergeCommand', () => {
  let baseFile: string;
  let incomingFile: string;
  let outputFile: string;

  beforeEach(() => {
    baseFile = writeTempEnv('A=1\nB=2\n');
    incomingFile = writeTempEnv('B=NEW_B\nC=3\n');
    outputFile = path.join(os.tmpdir(), `stackdiff-merge-out-${Date.now()}.env`);
  });

  afterEach(() => {
    [baseFile, incomingFile, outputFile].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('writes merged output to file with strategy ours', async () => {
    await runMergeCommand({
      base: baseFile,
      incoming: incomingFile,
      output: outputFile,
      strategy: 'ours',
    });
    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');   // ours keeps base
    expect(content).toContain('C=3');   // new key added
  });

  it('writes merged output with strategy theirs', async () => {
    await runMergeCommand({
      base: baseFile,
      incoming: incomingFile,
      output: outputFile,
      strategy: 'theirs',
    });
    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('B=NEW_B');
  });

  it('prints summary when verbose is true', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runMergeCommand({
      base: baseFile,
      incoming: incomingFile,
      output: outputFile,
      strategy: 'ours',
      verbose: true,
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Added:'));
    spy.mockRestore();
  });

  it('warns about conflicts when strategy is ours', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await runMergeCommand({
      base: baseFile,
      incoming: incomingFile,
      output: outputFile,
      strategy: 'ours',
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('conflict'));
    spy.mockRestore();
  });
});
