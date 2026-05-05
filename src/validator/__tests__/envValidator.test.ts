import { validateEnvMap, formatValidationReport, ValidationRule } from "../envValidator";

const rules: ValidationRule[] = [
  { key: "NODE_ENV", required: true, allowedValues: ["development", "staging", "production"] },
  { key: "PORT", required: true, pattern: /^\d+$/ },
  { key: "API_KEY", required: true, minLength: 16, maxLength: 64 },
  { key: "OPTIONAL_FEATURE", required: false, allowedValues: ["true", "false"] },
];

describe("validateEnvMap", () => {
  it("passes when all required keys are valid", () => {
    const env = { NODE_ENV: "production", PORT: "3000", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(true);
    expect(report.results.every((r) => r.valid)).toBe(true);
  });

  it("fails when a required key is missing", () => {
    const env = { NODE_ENV: "production", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(false);
    const portResult = report.results.find((r) => r.key === "PORT");
    expect(portResult?.valid).toBe(false);
    expect(portResult?.errors[0]).toMatch(/required/);
  });

  it("fails when value is not in allowedValues", () => {
    const env = { NODE_ENV: "test", PORT: "3000", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(false);
    const nodeResult = report.results.find((r) => r.key === "NODE_ENV");
    expect(nodeResult?.errors[0]).toMatch(/allowed values/);
  });

  it("fails when value does not match pattern", () => {
    const env = { NODE_ENV: "production", PORT: "abc", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(false);
    const portResult = report.results.find((r) => r.key === "PORT");
    expect(portResult?.errors[0]).toMatch(/pattern/);
  });

  it("fails when value is shorter than minLength", () => {
    const env = { NODE_ENV: "production", PORT: "3000", API_KEY: "short" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(false);
    const apiResult = report.results.find((r) => r.key === "API_KEY");
    expect(apiResult?.errors[0]).toMatch(/at least 16/);
  });

  it("ignores optional keys when absent", () => {
    const env = { NODE_ENV: "production", PORT: "8080", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(true);
  });

  it("validates optional keys when present", () => {
    const env = { NODE_ENV: "production", PORT: "8080", API_KEY: "abcdefghijklmnop", OPTIONAL_FEATURE: "yes" };
    const report = validateEnvMap(env, rules);
    expect(report.passed).toBe(false);
    const optResult = report.results.find((r) => r.key === "OPTIONAL_FEATURE");
    expect(optResult?.valid).toBe(false);
  });
});

describe("formatValidationReport", () => {
  it("returns success message when all pass", () => {
    const env = { NODE_ENV: "production", PORT: "3000", API_KEY: "abcdefghijklmnop" };
    const report = validateEnvMap(env, rules);
    expect(formatValidationReport(report)).toBe("All validation rules passed.");
  });

  it("lists errors when validation fails", () => {
    const env = { NODE_ENV: "bad", PORT: "3000", API_KEY: "short" };
    const report = validateEnvMap(env, rules);
    const output = formatValidationReport(report);
    expect(output).toMatch(/Validation failed/);
    expect(output).toMatch(/NODE_ENV/);
    expect(output).toMatch(/API_KEY/);
  });
});
