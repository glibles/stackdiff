import {
  parseTemplate,
  checkAgainstTemplate,
  formatTemplateReport,
  EnvTemplate,
} from '../envTemplate';

const rawTemplate = {
  name: 'my-service',
  version: '1.0',
  fields: {
    DATABASE_URL: { required: true, description: 'Postgres URL', example: 'postgres://...' },
    REDIS_URL: { required: true, description: 'Redis URL' },
    LOG_LEVEL: { required: false, default: 'info', description: 'Log verbosity' },
    PORT: { required: false, default: '3000' },
  },
};

describe('parseTemplate', () => {
  it('parses name and version', () => {
    const t = parseTemplate(rawTemplate);
    expect(t.name).toBe('my-service');
    expect(t.version).toBe('1.0');
  });

  it('parses required fields', () => {
    const t = parseTemplate(rawTemplate);
    const db = t.fields.find((f) => f.key === 'DATABASE_URL')!;
    expect(db.required).toBe(true);
    expect(db.example).toBe('postgres://...');
  });

  it('parses optional fields with defaults', () => {
    const t = parseTemplate(rawTemplate);
    const log = t.fields.find((f) => f.key === 'LOG_LEVEL')!;
    expect(log.required).toBe(false);
    expect(log.defaultValue).toBe('info');
  });

  it('falls back to unnamed when name missing', () => {
    const t = parseTemplate({ fields: {} });
    expect(t.name).toBe('unnamed');
  });
});

describe('checkAgainstTemplate', () => {
  let template: EnvTemplate;
  beforeEach(() => { template = parseTemplate(rawTemplate); });

  it('detects missing required keys', () => {
    const result = checkAgainstTemplate({ REDIS_URL: 'redis://localhost' }, template);
    expect(result.missing).toContain('DATABASE_URL');
    expect(result.missing).not.toContain('REDIS_URL');
  });

  it('does not flag optional keys as missing', () => {
    const result = checkAgainstTemplate({ DATABASE_URL: 'pg://', REDIS_URL: 'redis://' }, template);
    expect(result.missing).toHaveLength(0);
  });

  it('detects extra keys not in template', () => {
    const result = checkAgainstTemplate(
      { DATABASE_URL: 'pg://', REDIS_URL: 'redis://', UNKNOWN_KEY: 'val' },
      template
    );
    expect(result.extra).toContain('UNKNOWN_KEY');
  });

  it('fills defaults into withDefaults map', () => {
    const result = checkAgainstTemplate({ DATABASE_URL: 'pg://', REDIS_URL: 'redis://' }, template);
    expect(result.withDefaults.LOG_LEVEL).toBe('info');
    expect(result.withDefaults.PORT).toBe('3000');
  });

  it('does not override existing values with defaults', () => {
    const result = checkAgainstTemplate(
      { DATABASE_URL: 'pg://', REDIS_URL: 'redis://', LOG_LEVEL: 'debug' },
      template
    );
    expect(result.withDefaults.LOG_LEVEL).toBe('debug');
  });
});

describe('formatTemplateReport', () => {
  let template: EnvTemplate;
  beforeEach(() => { template = parseTemplate(rawTemplate); });

  it('reports success when no issues', () => {
    const result = checkAgainstTemplate(
      { DATABASE_URL: 'pg://', REDIS_URL: 'redis://' },
      template
    );
    const report = formatTemplateReport(result, template.name);
    expect(report).toContain('✓');
    expect(report).toContain('my-service');
  });

  it('lists missing keys', () => {
    const result = checkAgainstTemplate({}, template);
    const report = formatTemplateReport(result, template.name);
    expect(report).toContain('MISSING (required): DATABASE_URL');
  });

  it('lists extra keys', () => {
    const result = checkAgainstTemplate(
      { DATABASE_URL: 'pg://', REDIS_URL: 'redis://', SURPRISE: '1' },
      template
    );
    const report = formatTemplateReport(result, template.name);
    expect(report).toContain('EXTRA (not in template): SURPRISE');
  });
});
