import {
  renameEnvKeys,
  parseRenameRules,
  formatRenameSummary,
} from '../envRename';
import { EnvMap } from '../../parser';

describe('parseRenameRules', () => {
  it('parses valid FROM=TO pairs', () => {
    const rules = parseRenameRules(['OLD_KEY=NEW_KEY', 'FOO=BAR']);
    expect(rules).toEqual([
      { from: 'OLD_KEY', to: 'NEW_KEY' },
      { from: 'FOO', to: 'BAR' },
    ]);
  });

  it('throws on missing equals sign', () => {
    expect(() => parseRenameRules(['INVALID'])).toThrow(
      'Invalid rename rule "INVALID"'
    );
  });

  it('throws on empty FROM or TO', () => {
    expect(() => parseRenameRules(['=TO'])).toThrow();
    expect(() => parseRenameRules(['FROM='])).toThrow();
  });
});

describe('renameEnvKeys', () => {
  const base: EnvMap = {
    OLD_API_KEY: 'abc123',
    DB_HOST: 'localhost',
    PORT: '3000',
  };

  it('renames a key successfully', () => {
    const result = renameEnvKeys(base, [{ from: 'OLD_API_KEY', to: 'API_KEY' }]);
    expect(result.output).toHaveProperty('API_KEY', 'abc123');
    expect(result.output).not.toHaveProperty('OLD_API_KEY');
    expect(result.renamed).toHaveLength(1);
  });

  it('tracks not-found keys', () => {
    const result = renameEnvKeys(base, [{ from: 'MISSING', to: 'NEW' }]);
    expect(result.notFound).toHaveLength(1);
    expect(result.notFound[0].from).toBe('MISSING');
    expect(result.output).not.toHaveProperty('NEW');
  });

  it('skips rename when target key already exists', () => {
    const result = renameEnvKeys(base, [{ from: 'DB_HOST', to: 'PORT' }]);
    expect(result.skipped).toHaveLength(1);
    expect(result.output).toHaveProperty('DB_HOST', 'localhost');
    expect(result.output).toHaveProperty('PORT', '3000');
  });

  it('allows renaming a key to itself (no-op)', () => {
    const result = renameEnvKeys(base, [{ from: 'PORT', to: 'PORT' }]);
    expect(result.renamed).toHaveLength(1);
    expect(result.output).toHaveProperty('PORT', '3000');
  });

  it('does not mutate the original map', () => {
    renameEnvKeys(base, [{ from: 'OLD_API_KEY', to: 'API_KEY' }]);
    expect(base).toHaveProperty('OLD_API_KEY');
  });

  it('handles multiple rules in sequence', () => {
    const result = renameEnvKeys(base, [
      { from: 'OLD_API_KEY', to: 'API_KEY' },
      { from: 'DB_HOST', to: 'DATABASE_HOST' },
    ]);
    expect(result.renamed).toHaveLength(2);
    expect(result.output).toHaveProperty('API_KEY');
    expect(result.output).toHaveProperty('DATABASE_HOST');
  });
});

describe('formatRenameSummary', () => {
  it('includes renamed, skipped, and not-found sections', () => {
    const result = renameEnvKeys(
      { OLD: 'val', EXISTING: 'x' },
      [
        { from: 'OLD', to: 'NEW' },
        { from: 'OLD2', to: 'NEW2' },
        { from: 'EXISTING', to: 'NEW' },
      ]
    );
    const summary = formatRenameSummary(result);
    expect(summary).toContain('Renamed');
    expect(summary).toContain('Not found');
    expect(summary).toContain('Skipped');
  });

  it('returns fallback message when no rules applied', () => {
    const summary = formatRenameSummary({
      renamed: [],
      skipped: [],
      notFound: [],
      output: {},
    });
    expect(summary).toBe('No rename rules applied.');
  });
});
