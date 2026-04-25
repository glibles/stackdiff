import { diffEnvMaps, hasDifferences } from '../envDiff';

describe('diffEnvMaps', () => {
  it('detects added keys', () => {
    const base = { FOO: 'bar' };
    const target = { FOO: 'bar', NEW_KEY: 'value' };
    const result = diffEnvMaps(base, target);

    expect(result.added).toHaveLength(1);
    expect(result.added[0]).toMatchObject({ key: 'NEW_KEY', status: 'added', targetValue: 'value' });
  });

  it('detects removed keys', () => {
    const base = { FOO: 'bar', OLD_KEY: 'old' };
    const target = { FOO: 'bar' };
    const result = diffEnvMaps(base, target);

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]).toMatchObject({ key: 'OLD_KEY', status: 'removed', baseValue: 'old' });
  });

  it('detects changed values', () => {
    const base = { FOO: 'bar' };
    const target = { FOO: 'baz' };
    const result = diffEnvMaps(base, target);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0]).toMatchObject({ key: 'FOO', status: 'changed', baseValue: 'bar', targetValue: 'baz' });
  });

  it('detects unchanged keys', () => {
    const base = { FOO: 'bar', SAME: 'value' };
    const target = { FOO: 'bar', SAME: 'value' };
    const result = diffEnvMaps(base, target);

    expect(result.unchanged).toHaveLength(2);
    expect(result.changed).toHaveLength(0);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('returns entries sorted by key', () => {
    const base = { ZEBRA: '1', ALPHA: '2' };
    const target = { ZEBRA: '1', ALPHA: '2' };
    const result = diffEnvMaps(base, target);

    expect(result.entries.map((e) => e.key)).toEqual(['ALPHA', 'ZEBRA']);
  });

  it('handles empty maps', () => {
    const result = diffEnvMaps({}, {});
    expect(result.entries).toHaveLength(0);
  });
});

describe('hasDifferences', () => {
  it('returns true when there are differences', () => {
    const result = diffEnvMaps({ A: '1' }, { A: '2' });
    expect(hasDifferences(result)).toBe(true);
  });

  it('returns false when maps are identical', () => {
    const result = diffEnvMaps({ A: '1' }, { A: '1' });
    expect(hasDifferences(result)).toBe(false);
  });
});
