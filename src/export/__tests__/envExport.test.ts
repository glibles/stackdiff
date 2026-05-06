import { exportEnvMap, exportAsDotenv, exportAsJson, exportAsYaml, exportAsShell } from '../envExport';
import type { ExportOptions } from '../envExport';

const sampleMap = {
  DATABASE_URL: 'postgres://localhost/db',
  API_KEY: 'secret123',
  APP_ENV: 'production',
};

describe('exportAsDotenv', () => {
  it('exports key=value pairs', () => {
    const result = exportAsDotenv(sampleMap, { format: 'dotenv' });
    expect(result).toContain('API_KEY=secret123');
    expect(result).toContain('APP_ENV=production');
  });

  it('quotes values with spaces', () => {
    const result = exportAsDotenv({ KEY: 'hello world' }, { format: 'dotenv' });
    expect(result).toContain('KEY="hello world"');
  });

  it('includes header comment when provided', () => {
    const result = exportAsDotenv(sampleMap, { format: 'dotenv', header: 'Generated' });
    expect(result.startsWith('# Generated')).toBe(true);
  });

  it('sorts keys when sortKeys is true', () => {
    const result = exportAsDotenv(sampleMap, { format: 'dotenv', sortKeys: true });
    const keys = result.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')[0]);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('exportAsJson', () => {
  it('exports valid JSON', () => {
    const result = exportAsJson(sampleMap, { format: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed.API_KEY).toBe('secret123');
  });

  it('sorts keys when requested', () => {
    const result = exportAsJson(sampleMap, { format: 'json', sortKeys: true });
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('exportAsYaml', () => {
  it('exports key: value pairs', () => {
    const result = exportAsYaml({ FOO: 'bar' }, { format: 'yaml' });
    expect(result).toContain('FOO: bar');
  });

  it('quotes values with colons', () => {
    const result = exportAsYaml({ URL: 'http://example.com' }, { format: 'yaml' });
    expect(result).toContain('URL: "http://example.com"');
  });
});

describe('exportAsShell', () => {
  it('wraps values in double quotes', () => {
    const result = exportAsShell({ KEY: 'value' }, { format: 'shell' });
    expect(result).toContain('KEY="value"');
  });

  it('prepends export keyword when includeExports is true', () => {
    const result = exportAsShell({ KEY: 'value' }, { format: 'shell', includeExports: true });
    expect(result).toContain('export KEY="value"');
  });
});

describe('exportEnvMap', () => {
  it('delegates to correct formatter', () => {
    expect(() => exportEnvMap(sampleMap, { format: 'dotenv' })).not.toThrow();
    expect(() => exportEnvMap(sampleMap, { format: 'json' })).not.toThrow();
    expect(() => exportEnvMap(sampleMap, { format: 'yaml' })).not.toThrow();
    expect(() => exportEnvMap(sampleMap, { format: 'shell' })).not.toThrow();
  });

  it('throws on unknown format', () => {
    expect(() => exportEnvMap(sampleMap, { format: 'xml' as any })).toThrow('Unsupported export format');
  });
});
