import {
  isSensitiveKey,
  maskValue,
  maskEnvMap,
  listMaskedKeys,
} from '../envMask';

describe('isSensitiveKey', () => {
  it('detects common sensitive key names', () => {
    expect(isSensitiveKey('API_KEY')).toBe(true);
    expect(isSensitiveKey('DB_PASSWORD')).toBe(true);
    expect(isSensitiveKey('AUTH_TOKEN')).toBe(true);
    expect(isSensitiveKey('PRIVATE_KEY')).toBe(true);
    expect(isSensitiveKey('AWS_SECRET_ACCESS_KEY')).toBe(true);
  });

  it('does not flag non-sensitive keys', () => {
    expect(isSensitiveKey('PORT')).toBe(false);
    expect(isSensitiveKey('NODE_ENV')).toBe(false);
    expect(isSensitiveKey('APP_NAME')).toBe(false);
    expect(isSensitiveKey('LOG_LEVEL')).toBe(false);
  });
});

describe('maskValue', () => {
  it('masks entire value by default', () => {
    expect(maskValue('supersecret')).toBe('***');
  });

  it('uses custom placeholder', () => {
    expect(maskValue('supersecret', { placeholder: '[REDACTED]' })).toBe('[REDACTED]');
  });

  it('reveals trailing chars when revealChars > 0', () => {
    expect(maskValue('supersecret', { revealChars: 3 })).toBe('***ret');
  });

  it('returns empty string unchanged', () => {
    expect(maskValue('')).toBe('');
  });
});

describe('maskEnvMap', () => {
  const env = {
    PORT: '3000',
    DB_PASSWORD: 'hunter2',
    API_KEY: 'abc123',
    APP_NAME: 'myapp',
  };

  it('masks sensitive keys automatically', () => {
    const masked = maskEnvMap(env);
    expect(masked.PORT).toBe('3000');
    expect(masked.APP_NAME).toBe('myapp');
    expect(masked.DB_PASSWORD).toBe('***');
    expect(masked.API_KEY).toBe('***');
  });

  it('masks only specified keys when keys option provided', () => {
    const masked = maskEnvMap(env, { keys: ['PORT'] });
    expect(masked.PORT).toBe('***');
    expect(masked.DB_PASSWORD).toBe('hunter2');
  });

  it('does not mutate original map', () => {
    maskEnvMap(env);
    expect(env.DB_PASSWORD).toBe('hunter2');
  });
});

describe('listMaskedKeys', () => {
  it('returns keys that would be masked', () => {
    const env = { PORT: '3000', API_KEY: 'abc', SECRET: 'xyz' };
    const keys = listMaskedKeys(env);
    expect(keys).toContain('API_KEY');
    expect(keys).toContain('SECRET');
    expect(keys).not.toContain('PORT');
  });

  it('returns specified keys when keys option provided', () => {
    const env = { PORT: '3000', API_KEY: 'abc' };
    const keys = listMaskedKeys(env, { keys: ['PORT'] });
    expect(keys).toEqual(['PORT']);
  });
});
