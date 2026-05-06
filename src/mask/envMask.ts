import { EnvMap } from '../parser';

export type MaskOptions = {
  placeholder?: string;
  revealChars?: number;
  keys?: string[];
};

const SENSITIVE_PATTERNS = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /cert/i,
  /signing/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

export function maskValue(
  value: string,
  options: MaskOptions = {}
): string {
  const { placeholder = '***', revealChars = 0 } = options;
  if (value.length === 0) return value;
  if (revealChars <= 0) return placeholder;
  const revealed = value.slice(-revealChars);
  return `${placeholder}${revealed}`;
}

export function maskEnvMap(
  envMap: EnvMap,
  options: MaskOptions = {}
): EnvMap {
  const { keys } = options;
  const result: EnvMap = {};

  for (const [key, value] of Object.entries(envMap)) {
    const shouldMask = keys
      ? keys.includes(key)
      : isSensitiveKey(key);

    result[key] = shouldMask ? maskValue(value, options) : value;
  }

  return result;
}

export function listMaskedKeys(
  envMap: EnvMap,
  options: MaskOptions = {}
): string[] {
  const { keys } = options;
  return Object.keys(envMap).filter((key) =>
    keys ? keys.includes(key) : isSensitiveKey(key)
  );
}
