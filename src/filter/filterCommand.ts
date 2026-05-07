import * as fs from 'fs';
import * as path from 'path';
import { loadFromFile } from '../loader';
import { filterEnvMap, formatFilterSummary, FilterMode } from './envFilter';
import { exportAsDotenv } from '../export';

export interface FilterCommandOptions {
  input: string;
  patterns: string[];
  mode: FilterMode;
  output?: string;
  summary?: boolean;
  caseSensitive?: boolean;
}

export async function runFilterCommand(options: FilterCommandOptions): Promise<void> {
  const { input, patterns, mode, output, summary = false, caseSensitive = true } = options;

  if (patterns.length === 0) {
    throw new Error('At least one pattern must be provided.');
  }

  const env = loadFromFile(path.resolve(input));

  const filtered = filterEnvMap(env, { patterns, mode, caseSensitive });

  const dotenv = exportAsDotenv(filtered);

  if (output) {
    fs.writeFileSync(path.resolve(output), dotenv, 'utf-8');
    if (summary) {
      console.log(formatFilterSummary(env, filtered, { patterns, mode, caseSensitive }));
    }
  } else {
    process.stdout.write(dotenv);
    if (summary) {
      console.error(formatFilterSummary(env, filtered, { patterns, mode, caseSensitive }));
    }
  }
}
