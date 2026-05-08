import { matchesPattern, keyMatchesAny, filterEnvMap, formatFilterSummary } from '../envFilter';

describe('matchesPattern', () => {
  it('matches exact key', () => {
    expect(matchesPattern('FOO', 'FOO')).toBe(true);
    expect(matchesPattern('FOO', 'BAR')).toBe(false);
  });

  it('matches wildcard *', () => {
    expect(matchesPattern('FOO', '*')).toBe(true);
    expect(matchesPattern('', '*')).toBe(true);
  });

  it('matches prefix wildcard AWS_*', () => {
    expect(matchesPattern('AWS_SECRET', 'AWS_*')).toBe(true);
    expect(matchesPattern('AWS_KEY', 'AWS_*')).toBe(true);
    expect(matchesPattern('DB_HOST', 'AWS_*')).toBe(false);
  });

  it('matches suffix wildcard *_KEY', () => {
    expect(matchesPattern('API_KEY', '*_KEY')).toBe(true);
    expect(matchesPattern('SECRET_KEY', '*_KEY')).toBe(true);
    expect(matchesPattern('API_SECRET', '*_KEY')).toBe(false);
  });
});

describe('keyMatchesAny', () => {
  it('returns true if any pattern matches', () => {
    expect(keyMatchesAny('AWS_KEY', ['DB_*', 'AWS_*'])).toBe(true);
  });

  it('returns false if no pattern matches', () => {
    expect(keyMatchesAny('FOO', ['BAR', 'BAZ'])).toBe(false);
  });

  it('returns false for empty patterns', () => {
    expect(keyMatchesAny('FOO', [])).toBe(false);
  });
});

describe('filterEnvMap', () => {
  const env = {
    AWS_KEY: '123',
    AWS_SECRET: 'abc',
    DB_HOST: 'localhost',
    DB_PASS: 'secret',
    PORT: '3000',
  };

  it('returns all keys when no patterns given', () => {
    const { result, included, excluded } = filterEnvMap(env);
    expect(Object.keys(result)).toHaveLength(5);
    expect(excluded).toHaveLength(0);
    expect(included).toHaveLength(5);
  });

  it('filters by include pattern', () => {
    const { result, included, excluded } = filterEnvMap(env, ['AWS_*']);
    expect(Object.keys(result)).toEqual(['AWS_KEY', 'AWS_SECRET']);
    expect(included).toEqual(['AWS_KEY', 'AWS_SECRET']);
    expect(excluded).toHaveLength(3);
  });

  it('filters by exclude pattern', () => {
    const { result, excluded } = filterEnvMap(env, [], ['DB_*']);
    expect(result).not.toHaveProperty('DB_HOST');
    expect(result).not.toHaveProperty('DB_PASS');
    expect(excluded).toContain('DB_HOST');
    expect(excluded).toContain('DB_PASS');
  });

  it('applies include then exclude', () => {
    const { result } = filterEnvMap(env, ['DB_*', 'PORT'], ['DB_PASS']);
    expect(Object.keys(result)).toEqual(['DB_HOST', 'PORT']);
  });

  it('preserves values in result', () => {
    const { result } = filterEnvMap(env, ['PORT']);
    expect(result['PORT']).toBe('3000');
  });
});

describe('formatFilterSummary', () => {
  it('shows included and excluded counts', () => {
    const summary = formatFilterSummary(['A', 'B'], ['C']);
    expect(summary).toContain('Included: 2');
    expect(summary).toContain('Excluded: 1');
    expect(summary).toContain('C');
  });

  it('omits excluded key list when none excluded', () => {
    const summary = formatFilterSummary(['A'], []);
    expect(summary).not.toContain('Excluded keys');
  });
});
