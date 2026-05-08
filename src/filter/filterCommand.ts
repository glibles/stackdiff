import { loadFromFile, loadFromEnv } from '../loader';
import { filterEnvMap, formatFilterSummary } from './envFilter';
import { exportAsDotenv } from '../export';
import * as fs from 'fs';

export interface FilterCommandOptions {
  input?: string;
  output?: string;
  include?: string[];
  exclude?: string[];
  prefix?: string;
  fromEnv?: boolean;
  silent?: boolean;
}

export async function runFilterCommand(options: FilterCommandOptions): Promise<void> {
  const envMap = options.fromEnv
    ? loadFromEnv()
    : loadFromFile(options.input ?? '.env');

  const includePatterns = options.include ?? [];
  const excludePatterns = options.exclude ?? [];

  if (options.prefix) {
    includePatterns.push(`${options.prefix}*`);
  }

  const { result, included, excluded } = filterEnvMap(envMap, includePatterns, excludePatterns);

  if (!options.silent) {
    console.log(formatFilterSummary(included, excluded));
  }

  const serialized = exportAsDotenv(result);

  if (options.output) {
    fs.writeFileSync(options.output, serialized, 'utf-8');
    if (!options.silent) {
      console.log(`Written to ${options.output}`);
    }
  } else {
    process.stdout.write(serialized);
  }
}
