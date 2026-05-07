import {
  matchesPattern,
  keyMatchesAny,
  filterEnvMap,
  formatFilterSummary,
} from '../envFilter';
import { EnvMap } from '../../parser';

describe('matchesPattern', () => {
  it('matches exact key', () => {
    expect(matchesPattern('DATABASE_URL', 'DATABASE_URL')).toBe(true);
  });

  it('does not match different key', () => {
    expect(matchesPattern('DATABASE_URL', 'REDIS_URL')).toBe(false);
  });

  it('matches wildcard suffix', () => {
    expect(matchesPattern('AWS_ACCESS_KEY', 'AWS_*')).toBe(true);
  });

  it('matches wildcard prefix', () => {
    expect(matchesPattern('SECRET_KEY', '*_KEY')).toBe(true);
  });

  it('is case-sensitive by default', () => {
    expect(matchesPattern('database_url', 'DATABASE_URL')).toBe(false);
  });

  it('is case-insensitive when flag set', () => {
    expect(matchesPattern('database_url', 'DATABASE_URL', false)).toBe(true);
  });
});

describe('keyMatchesAny', () => {
  it('returns true when at least one pattern matches', () => {
    expect(keyMatchesAny('AWS_SECRET', ['DB_*', 'AWS_*'])).toBe(true);
  });

  it('returns false when no pattern matches', () => {
    expect(keyMatchesAny('PORT', ['DB_*', 'AWS_*'])).toBe(false);
  });
});

describe('filterEnvMap', () => {
  const env: EnvMap = {
    AWS_ACCESS_KEY: 'key',
    AWS_SECRET: 'secret',
    DATABASE_URL: 'postgres://localhost',
    PORT: '3000',
    NODE_ENV: 'production',
  };

  it('includes only matching keys', () => {
    const result = filterEnvMap(env, { patterns: ['AWS_*'], mode: 'include' });
    expect(Object.keys(result)).toEqual(['AWS_ACCESS_KEY', 'AWS_SECRET']);
  });

  it('excludes matching keys', () => {
    const result = filterEnvMap(env, { patterns: ['AWS_*'], mode: 'exclude' });
    expect(Object.keys(result)).not.toContain('AWS_ACCESS_KEY');
    expect(Object.keys(result)).not.toContain('AWS_SECRET');
    expect(result.PORT).toBe('3000');
  });

  it('returns empty map when all keys excluded', () => {
    const result = filterEnvMap(env, { patterns: ['*'], mode: 'exclude' });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('returns full map when no patterns match in include mode', () => {
    const result = filterEnvMap(env, { patterns: ['NONEXISTENT_*'], mode: 'include' });
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('formatFilterSummary', () => {
  it('produces a summary string', () => {
    const original: EnvMap = { A: '1', B: '2', C: '3' };
    const filtered: EnvMap = { A: '1' };
    const summary = formatFilterSummary(original, filtered, { patterns: ['A'], mode: 'include' });
    expect(summary).toContain('Keys before : 3');
    expect(summary).toContain('Keys after  : 1');
    expect(summary).toContain('Removed     : 2');
    expect(summary).toContain('include');
  });
});
