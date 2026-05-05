export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
}

export interface ValidationResult {
  key: string;
  valid: boolean;
  errors: string[];
}

export interface ValidationReport {
  passed: boolean;
  results: ValidationResult[];
}

export function validateEnvMap(
  envMap: Record<string, string>,
  rules: ValidationRule[]
): ValidationReport {
  const results: ValidationResult[] = [];

  for (const rule of rules) {
    const errors: string[] = [];
    const value = envMap[rule.key];

    if (rule.required && (value === undefined || value === "")) {
      errors.push(`Key "${rule.key}" is required but missing or empty.`);
    }

    if (value !== undefined && value !== "") {
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Key "${rule.key}" does not match required pattern ${rule.pattern}.`);
      }

      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(
          `Key "${rule.key}" has value "${value}" which is not in allowed values: [${rule.allowedValues.join(", ")}].`
        );
      }

      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`Key "${rule.key}" must be at least ${rule.minLength} characters long.`);
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`Key "${rule.key}" must be at most ${rule.maxLength} characters long.`);
      }
    }

    results.push({ key: rule.key, valid: errors.length === 0, errors });
  }

  return {
    passed: results.every((r) => r.valid),
    results,
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  for (const result of report.results) {
    if (!result.valid) {
      for (const err of result.errors) {
        lines.push(`  ✖ ${err}`);
      }
    }
  }
  if (lines.length === 0) {
    return "All validation rules passed.";
  }
  return `Validation failed:\n${lines.join("\n")}`;
}
