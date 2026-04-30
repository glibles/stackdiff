import { colorize, formatEntry, formatSummary, renderTextReport, renderReport } from '../envReporter';
import { diffEnvMaps } from '../../diff/envDiff';

describe('colorize', () => {
  it('wraps text in ANSI color codes for added', () => {
    const result = colorize('hello', 'added');
    expect(result).toContain('hello');
    expect(result).toMatch(/\x1b\[/);
  });

  it('wraps text in ANSI color codes for removed', () => {
    const result = colorize('hello', 'removed');
    expect(result).toContain('hello');
    expect(result).toMatch(/\x1b\[/);
  });

  it('wraps text in ANSI color codes for changed', () => {
    const result = colorize('hello', 'changed');
    expect(result).toContain('hello');
    expect(result).toMatch(/\x1b\[/);
  });

  it('returns plain text for unchanged', () => {
    const result = colorize('hello', 'unchanged');
    expect(result).toContain('hello');
  });
});

describe('formatEntry', () => {
  it('formats an added entry with + prefix', () => {
    const result = formatEntry({ key: 'FOO', status: 'added', rightValue: 'bar' }, false);
    expect(result).toContain('+');
    expect(result).toContain('FOO');
    expect(result).toContain('bar');
  });

  it('formats a removed entry with - prefix', () => {
    const result = formatEntry({ key: 'FOO', status: 'removed', leftValue: 'old' }, false);
    expect(result).toContain('-');
    expect(result).toContain('FOO');
  });

  it('formats a changed entry showing both values', () => {
    const result = formatEntry({ key: 'FOO', status: 'changed', leftValue: 'old', rightValue: 'new' }, false);
    expect(result).toContain('FOO');
    expect(result).toContain('old');
    expect(result).toContain('new');
  });
});

describe('formatSummary', () => {
  it('returns a summary string with counts', () => {
    const diff = diffEnvMaps({ A: '1', B: '2' }, { A: '1', C: '3' });
    const summary = formatSummary(diff);
    expect(summary).toMatch(/added/i);
    expect(summary).toMatch(/removed/i);
  });
});

describe('renderTextReport', () => {
  it('renders a full text report from a diff result', () => {
    const diff = diffEnvMaps({ A: '1', B: '2' }, { A: '9', C: '3' });
    const report = renderTextReport(diff, false);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
    expect(report).toContain('A');
  });

  it('returns a message when there are no differences', () => {
    const diff = diffEnvMaps({ A: '1' }, { A: '1' });
    const report = renderTextReport(diff, false);
    expect(report).toMatch(/no differences/i);
  });
});

describe('renderReport', () => {
  it('delegates to renderTextReport for text format', () => {
    const diff = diffEnvMaps({ X: '1' }, { X: '2' });
    const report = renderReport(diff, 'text', false);
    expect(typeof report).toBe('string');
    expect(report).toContain('X');
  });

  it('returns JSON string for json format', () => {
    const diff = diffEnvMaps({ X: '1' }, { Y: '2' });
    const report = renderReport(diff, 'json', false);
    const parsed = JSON.parse(report);
    expect(Array.isArray(parsed)).toBe(true);
  });
});
