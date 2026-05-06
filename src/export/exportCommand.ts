import * as fs from 'fs';
import * as path from 'path';
import { loadFromFile, loadFromEnv } from '../loader';
import { exportEnvMap } from './envExport';
import type { ExportFormat } from './envExport';

export interface ExportCommandOptions {
  input?: string;
  output?: string;
  format: ExportFormat;
  sortKeys?: boolean;
  includeExports?: boolean;
  fromEnv?: boolean;
  header?: string;
}

export async function runExportCommand(options: ExportCommandOptions): Promise<void> {
  let envMap: Record<string, string>;

  if (options.fromEnv) {
    envMap = loadFromEnv();
  } else if (options.input) {
    const resolved = path.resolve(options.input);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Input file not found: ${resolved}`);
    }
    envMap = loadFromFile(resolved);
  } else {
    throw new Error('Either --input or --from-env must be specified');
  }

  const result = exportEnvMap(envMap, {
    format: options.format,
    sortKeys: options.sortKeys ?? false,
    includeExports: options.includeExports ?? false,
    header: options.header,
  });

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.writeFileSync(outPath, result, 'utf-8');
    console.log(`Exported ${Object.keys(envMap).length} variables to ${outPath} (${options.format})`);
  } else {
    process.stdout.write(result + '\n');
  }
}
