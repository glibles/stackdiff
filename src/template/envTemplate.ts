import { EnvMap } from '../parser';

export interface TemplateField {
  key: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  example?: string;
}

export interface EnvTemplate {
  name: string;
  version?: string;
  fields: TemplateField[];
}

/**
 * Parse a template definition from a JSON-like object.
 */
export function parseTemplate(raw: Record<string, unknown>): EnvTemplate {
  const fields: TemplateField[] = [];
  const rawFields = (raw.fields ?? {}) as Record<string, Record<string, unknown>>;

  for (const [key, meta] of Object.entries(rawFields)) {
    fields.push({
      key,
      required: meta.required !== false,
      description: typeof meta.description === 'string' ? meta.description : undefined,
      defaultValue: typeof meta.default === 'string' ? meta.default : undefined,
      example: typeof meta.example === 'string' ? meta.example : undefined,
    });
  }

  return {
    name: typeof raw.name === 'string' ? raw.name : 'unnamed',
    version: typeof raw.version === 'string' ? raw.version : undefined,
    fields,
  };
}

export interface TemplateCheckResult {
  missing: string[];
  extra: string[];
  withDefaults: EnvMap;
}

/**
 * Check an EnvMap against a template, returning missing/extra keys
 * and a merged map that fills in default values.
 */
export function checkAgainstTemplate(
  env: EnvMap,
  template: EnvTemplate
): TemplateCheckResult {
  const templateKeys = new Set(template.fields.map((f) => f.key));
  const envKeys = new Set(Object.keys(env));

  const missing = template.fields
    .filter((f) => f.required && !envKeys.has(f.key) && f.defaultValue === undefined)
    .map((f) => f.key);

  const extra = [...envKeys].filter((k) => !templateKeys.has(k));

  const withDefaults: EnvMap = { ...env };
  for (const field of template.fields) {
    if (!(field.key in withDefaults) && field.defaultValue !== undefined) {
      withDefaults[field.key] = field.defaultValue;
    }
  }

  return { missing, extra, withDefaults };
}

/**
 * Render a human-readable template check report.
 */
export function formatTemplateReport(result: TemplateCheckResult, templateName: string): string {
  const lines: string[] = [`Template check: ${templateName}`];
  if (result.missing.length === 0 && result.extra.length === 0) {
    lines.push('  ✓ All required keys present, no unexpected keys.');
  } else {
    for (const k of result.missing) lines.push(`  ✗ MISSING (required): ${k}`);
    for (const k of result.extra) lines.push(`  ~ EXTRA (not in template): ${k}`);
  }
  return lines.join('\n');
}
