import * as fs from 'fs';
import * as path from 'path';
import { loadFromFile } from '../loader';
import { mergeEnvMaps, formatMergeSummary, MergeStrategy } from './envMerge';
import { serializeEnvMap } from '../reconciler/envReconciler';

export interface MergeCommandOptions {
  base: string;
  incoming: string;
  output?: string;
  strategy: MergeStrategy;
  verbose?: boolean;
}

export async function runMergeCommand(opts: MergeCommandOptions): Promise<void> {
  const baseMap = loadFromFile(opts.base);
  const incomingMap = loadFromFile(opts.incoming);

  const result = mergeEnvMaps(baseMap, incomingMap, { strategy: opts.strategy });

  if (opts.verbose) {
    console.log(formatMergeSummary(result));
  }

  const serialized = serializeEnvMap(result.merged);

  if (opts.output) {
    const outPath = path.resolve(opts.output);
    fs.writeFileSync(outPath, serialized, 'utf-8');
    console.log(`Merged env written to ${outPath}`);
  } else {
    process.stdout.write(serialized);
  }

  if (result.conflicts.length > 0 && opts.strategy === 'ours') {
    console.warn(
      `Warning: ${result.conflicts.length} conflict(s) kept from base (--strategy=ours). ` +
      `Keys: ${result.conflicts.join(', ')}`
    );
  }
}
