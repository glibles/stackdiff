import { reconcileEnvMaps, serializeEnvMap } from '../envReconciler';
import { DiffResult } from '../../diff';

const source = { API_URL: 'https://new.example.com', DB_HOST: 'db.new', NEW_KEY: 'hello' };
const target = { API_URL: 'https://old.example.com', DB_HOST: 'db.new', OLD_KEY: 'legacy' };

const diff: DiffResult = {
  added: ['NEW_KEY'],
  removed: ['OLD_KEY'],
  modified: ['API_URL'],
  unchanged: ['DB_HOST'],
};

describe('reconcileEnvMaps', () => {
  it('adds missing source keys to target', () => {
    const { reconciled } = reconcileEnvMaps(source, target, diff, { strategy: 'use-source' });
    expect(reconciled['NEW_KEY']).toBe('hello');
  });

  it('use-source strategy overwrites modified keys', () => {
    const { reconciled, applied } = reconcileEnvMaps(source, target, diff, { strategy: 'use-source' });
    expect(reconciled['API_URL']).toBe('https://new.example.com');
    expect(applied).toContain('API_URL');
  });

  it('use-target strategy keeps target value for modified keys', () => {
    const { reconciled, skipped } = reconcileEnvMaps(source, target, diff, { strategy: 'use-target' });
    expect(reconciled['API_URL']).toBe('https://old.example.com');
    expect(skipped).toContain('API_URL');
  });

  it('preserves removed keys when omitMissing is false', () => {
    const { reconciled, skipped } = reconcileEnvMaps(source, target, diff, { strategy: 'use-source', omitMissing: false });
    expect(reconciled['OLD_KEY']).toBe('legacy');
    expect(skipped).toContain('OLD_KEY');
  });

  it('drops removed keys when omitMissing is true', () => {
    const { reconciled, applied } = reconcileEnvMaps(source, target, diff, { strategy: 'use-source', omitMissing: true });
    expect(reconciled['OLD_KEY']).toBeUndefined();
    expect(applied).toContain('OLD_KEY');
  });

  it('unchanged keys are always preserved', () => {
    const { reconciled } = reconcileEnvMaps(source, target, diff, { strategy: 'use-source' });
    expect(reconciled['DB_HOST']).toBe('db.new');
  });
});

describe('serializeEnvMap', () => {
  it('serializes keys in sorted order', () => {
    const output = serializeEnvMap({ Z_KEY: 'z', A_KEY: 'a' });
    expect(output.indexOf('A_KEY')).toBeLessThan(output.indexOf('Z_KEY'));
  });

  it('quotes values containing spaces', () => {
    const output = serializeEnvMap({ MSG: 'hello world' });
    expect(output).toContain('MSG="hello world"');
  });

  it('does not quote plain values', () => {
    const output = serializeEnvMap({ TOKEN: 'abc123' });
    expect(output).toContain('TOKEN=abc123');
  });

  it('ends with a newline', () => {
    const output = serializeEnvMap({ KEY: 'val' });
    expect(output.endsWith('\n')).toBe(true);
  });
});
