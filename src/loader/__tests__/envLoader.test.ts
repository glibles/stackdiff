import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadFromFile, loadFromString, loadFromEnv } from '../envLoader';

function writeTempFile(content: string): string {
  const tmpPath = path.join(os.tmpdir(), `stackdiff-test-${Date.now()}.env`);
  fs.writeFileSync(tmpPath, content, 'utf8');
  return tmpPath;
}

describe('loadFromFile', () => {
  it('loads and parses a valid .env file', () => {
    const tmpFile = writeTempFile('FOO=bar\nBAZ=qux\n');
    const result = loadFromFile(tmpFile);
    expect(result.error).toBeUndefined();
    expect(result.map).toEqual({ FOO: 'bar', BAZ: 'qux' });
    fs.unlinkSync(tmpFile);
  });

  it('returns an error for a missing file', () => {
    const result = loadFromFile('/nonexistent/path/.env');
    expect(result.map).toEqual({});
    expect(result.error).toMatch(/File not found/);
  });

  it('sets source to the provided path', () => {
    const tmpFile = writeTempFile('KEY=value\n');
    const result = loadFromFile(tmpFile);
    expect(result.source).toBe(tmpFile);
    fs.unlinkSync(tmpFile);
  });

  it('handles an empty file gracefully', () => {
    const tmpFile = writeTempFile('');
    const result = loadFromFile(tmpFile);
    expect(result.error).toBeUndefined();
    expect(result.map).toEqual({});
    fs.unlinkSync(tmpFile);
  });
});

describe('loadFromString', () => {
  it('parses a valid env string', () => {
    const result = loadFromString('HELLO=world\nNUM=42');
    expect(result.error).toBeUndefined();
    expect(result.map).toEqual({ HELLO: 'world', NUM: '42' });
  });

  it('uses default label when none provided', () => {
    const result = loadFromString('X=1');
    expect(result.source).toBe('inline');
  });

  it('uses custom label when provided', () => {
    const result = loadFromString('X=1', 'staging.env');
    expect(result.source).toBe('staging.env');
  });

  it('handles an empty string gracefully', () => {
    const result = loadFromString('');
    expect(result.error).toBeUndefined();
    expect(result.map).toEqual({});
  });
});

describe('loadFromEnv', () => {
  const original = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in original)) delete process.env[key];
    }
  });

  it('loads all env vars when no prefix given', () => {
    process.env.TEST_STACKDIFF_VAR = 'hello';
    const result = loadFromEnv();
    expect(result.map['TEST_STACKDIFF_VAR']).toBe('hello');
    expect(result.source).toBe('process.env');
  });

  it('filters by prefix and strips it from keys', () => {
    process.env.APP_PORT = '3000';
    process.env.APP_HOST = 'localhost';
    process.env.OTHER_KEY = 'ignored';
    const result = loadFromEnv('APP_');
    expect(result.map).toMatchObject({ PORT: '3000', HOST: 'localhost' });
    expect(result.map['OTHER_KEY']).toBeUndefined();
    expect(result.source).toBe('process.env[APP_*]');
  });

  it('returns an empty map when prefix matches no keys', () => {
    const result = loadFromEnv('NONEXISTENT_PREFIX_XYZ_');
    expect(result.map).toEqual({});
    expect(result.source).toBe('process.env[NONEXISTENT_PREFIX_XYZ_*]');
  });
});
