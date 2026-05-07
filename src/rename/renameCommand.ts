import * as fs from 'fs';
import { loadFromFile, loadFromString } from '../loader';
import { serializeEnvMap } from '../reconciler';
import { parseRenameRules, renameEnvKeys, formatRenameSummary } from './envRename';

export interface RenameCommandOptions {
  file: string;
  rules: string[];
  output?: string;
  dryRun?: boolean;
  quiet?: boolean;
}

export async function runRenameCommand(opts: RenameCommandOptions): Promise<void> {
  const { file, rules: rawRules, output, dryRun = false, quiet = false } = opts;

  let env: Record<string, string>;
  try {
    env = loadFromFile(file);
  } catch (err: any) {
    console.error(`Error loading file "${file}": ${err.message}`);
    process.exit(1);
  }

  let renameRules;
  try {
    renameRules = parseRenameRules(rawRules);
  } catch (err: any) {
    console.error(`Error parsing rename rules: ${err.message}`);
    process.exit(1);
  }

  const result = renameEnvKeys(env, renameRules);

  if (!quiet) {
    console.log(formatRenameSummary(result));
  }

  if (dryRun) {
    if (!quiet) console.log('\n[dry-run] No files written.');
    return;
  }

  const serialized = serializeEnvMap(result.output);
  const dest = output ?? file;

  try {
    fs.writeFileSync(dest, serialized, 'utf-8');
    if (!quiet) console.log(`\nWritten to ${dest}`);
  } catch (err: any) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }
}
