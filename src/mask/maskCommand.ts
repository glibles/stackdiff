import * as fs from 'fs';
import { loadFromFile, loadFromEnv } from '../loader';
import { maskEnvMap, listMaskedKeys, MaskOptions } from './envMask';
import { serializeEnvMap } from '../reconciler/envReconciler';

export interface MaskCommandOptions {
  file?: string;
  fromEnv?: boolean;
  keys?: string[];
  revealChars?: number;
  placeholder?: string;
  listOnly?: boolean;
  output?: string;
}

export async function runMaskCommand(opts: MaskCommandOptions): Promise<void> {
  let envMap: Record<string, string>;

  if (opts.fromEnv) {
    envMap = loadFromEnv();
  } else if (opts.file) {
    envMap = loadFromFile(opts.file);
  } else {
    throw new Error('Provide --file <path> or --from-env');
  }

  const maskOptions: MaskOptions = {
    placeholder: opts.placeholder ?? '***',
    revealChars: opts.revealChars ?? 0,
    keys: opts.keys,
  };

  if (opts.listOnly) {
    const masked = listMaskedKeys(envMap, maskOptions);
    console.log('Keys that would be masked:');
    masked.forEach((k) => console.log(`  ${k}`));
    console.log(`\nTotal: ${masked.length}`);
    return;
  }

  const maskedMap = maskEnvMap(envMap, maskOptions);
  const serialized = serializeEnvMap(maskedMap);

  if (opts.output) {
    fs.writeFileSync(opts.output, serialized, 'utf8');
    console.log(`Masked env written to ${opts.output}`);
  } else {
    console.log(serialized);
  }
}
