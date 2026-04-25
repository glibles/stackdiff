import { parseEnvString, parseEnvFile } from '../envParser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('parseEnvString', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvString('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const result = parseEnvString('# this is a comment\nKEY=value');
    expect(result).toEqual({ KEY: 'value' });
  });

  it('ignores blank lines', () => {
    const result = parseEnvString('\nKEY=value\n\n');
    expect(result).toEqual({ KEY: 'value' });
  });

  it('strips double-quoted values', () => {
    const result = parseEnvString('KEY="hello world"');
    expect(result).toEqual({ KEY: 'hello world' });
  });

  it('strips single-quoted values', () => {
    const result = parseEnvString("KEY='hello world'");
    expect(result).toEqual({ KEY: 'hello world' });
  });

  it('handles values containing = signs', () => {
    const result = parseEnvString('KEY=a=b=c');
    expect(result).toEqual({ KEY: 'a=b=c' });
  });

  it('handles empty values', () => {
    const result = parseEnvString('KEY=');
    expect(result).toEqual({ KEY: '' });
  });

  it('ignores lines without = sign', () => {
    const result = parseEnvString('INVALID_LINE\nKEY=value');
    expect(result).toEqual({ KEY: 'value' });
  });
});

describe('parseEnvFile', () => {
  it('reads and parses a real file', () => {
    const tmpFile = path.join(os.tmpdir(), 'stackdiff-test.env');
    fs.writeFileSync(tmpFile, 'APP_ENV=production\nPORT=3000\n');

    const result = parseEnvFile(tmpFile);
    expect(result).toEqual({ APP_ENV: 'production', PORT: '3000' });

    fs.unlinkSync(tmpFile);
  });

  it('throws if file does not exist', () => {
    expect(() => parseEnvFile('/nonexistent/path/.env')).toThrow('File not found');
  });
});
