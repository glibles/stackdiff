import { ValidationRule } from "./envValidator";

/**
 * A sensible set of default validation rules for common environment variables.
 * Consumers can extend or override these for their own deployments.
 */
export const defaultRules: ValidationRule[] = [
  {
    key: "NODE_ENV",
    required: true,
    allowedValues: ["development", "test", "staging", "production"],
  },
  {
    key: "PORT",
    required: false,
    pattern: /^\d{2,5}$/,
  },
  {
    key: "LOG_LEVEL",
    required: false,
    allowedValues: ["debug", "info", "warn", "error", "silent"],
  },
  {
    key: "DATABASE_URL",
    required: false,
    pattern: /^(postgres|mysql|sqlite|mongodb)(\+\w+)?:\/\/.+/,
    minLength: 10,
  },
  {
    key: "SECRET_KEY",
    required: false,
    minLength: 32,
    maxLength: 128,
  },
];

/**
 * Merge user-supplied rules with the defaults.
 * User rules for the same key take precedence.
 */
export function mergeRules(
  base: ValidationRule[],
  overrides: ValidationRule[]
): ValidationRule[] {
  const overrideMap = new Map(overrides.map((r) => [r.key, r]));
  const merged = base
    .filter((r) => !overrideMap.has(r.key))
    .concat(overrides);
  return merged;
}
