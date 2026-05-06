import { mergeEnvMaps, formatMergeSummary, MergeResult } from '../envMerge';

describe('mergeEnvMaps', () => {
  const base = { A: '1', B: '2', C: '3' };
  const incoming = { B: 'NEW_B', C: '3', D: '4' };

  it('strategy ours: keeps base values on conflict, adds new keys', () => {
    const result = mergeEnvMaps(base, incoming, { strategy: 'ours' });
    expect(result.merged.A).toBe('1');
    expect(result.merged.B).toBe('2');  // base wins
    expect(result.merged.C).toBe('3');
    expect(result.merged.D).toBe('4');  // new key added
    expect(result.added).toEqual(['D']);
    expect(result.conflicts).toEqual(['B']);
    expect(result.overwritten).toHaveLength(0);
  });

  it('strategy theirs: incoming wins on conflict', () => {
    const result = mergeEnvMaps(base, incoming, { strategy: 'theirs' });
    expect(result.merged.B).toBe('NEW_B');
    expect(result.overwritten).toContain('B');
    expect(result.conflicts).toContain('B');
  });

  it('strategy union: includes all keys, prefers incoming', () => {
    const result = mergeEnvMaps(base, incoming, { strategy: 'union' });
    expect(result.merged.B).toBe('NEW_B');
    expect(result.merged.D).toBe('4');
    expect(result.added).toContain('D');
  });

  it('no conflicts when maps are identical', () => {
    const result = mergeEnvMaps(base, base, { strategy: 'ours' });
    expect(result.conflicts).toHaveLength(0);
    expect(result.added).toHaveLength(0);
    expect(result.overwritten).toHaveLength(0);
  });

  it('merges into empty base', () => {
    const result = mergeEnvMaps({}, incoming, { strategy: 'ours' });
    expect(result.merged).toEqual(incoming);
    expect(result.added).toHaveLength(Object.keys(incoming).length);
    expect(result.conflicts).toHaveLength(0);
  });

  it('does not mutate base map', () => {
    const baseCopy = { ...base };
    mergeEnvMaps(base, incoming, { strategy: 'theirs' });
    expect(base).toEqual(baseCopy);
  });
});

describe('formatMergeSummary', () => {
  it('produces a multi-line summary', () => {
    const result: MergeResult = {
      merged: {},
      conflicts: ['X', 'Y'],
      added: ['Z'],
      overwritten: ['X'],
    };
    const summary = formatMergeSummary(result);
    expect(summary).toContain('Added:');
    expect(summary).toContain('Conflicts:  2');
    expect(summary).toContain('Conflict keys: X, Y');
  });

  it('omits conflict keys line when no conflicts', () => {
    const result: MergeResult = { merged: {}, conflicts: [], added: [], overwritten: [] };
    const summary = formatMergeSummary(result);
    expect(summary).not.toContain('Conflict keys');
  });
});
