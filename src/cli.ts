#!/usr/bin/env node

/**
 * stackdiff CLI entry point
 * Provides commands to diff and reconcile environment variable sets
 * across deployment targets.
 */

import { Command } from 'commander';
import * as path from 'path';
import { loadFromFile, loadFromEnv } from './loader';
import { diffEnvMaps, hasDifferences } from './diff';
import { renderReport } from './reporter/envReporter';
import { reconcileEnvMaps, serializeEnvMap } from './reconciler/envReconciler';
import * as fs from 'fs';

const program = new Command();

program
  .name('stackdiff')
  .description('Diff and reconcile environment variable sets across deployment targets')
  .version('0.1.0');

/**
 * `diff` command — compare two .env files and print a report.
 *
 * Usage:
 *   stackdiff diff <base> <target> [options]
 */
program
  .command('diff <base> <target>')
  .description('Diff two .env files and display differences')
  .option('-f, --format <format>', 'Output format: text or json', 'text')
  .option('--no-color', 'Disable colored output')
  .action((base: string, target: string, options: { format: string; color: boolean }) => {
    try {
      const baseMap = loadFromFile(path.resolve(base));
      const targetMap = loadFromFile(path.resolve(target));

      const diff = diffEnvMaps(baseMap, targetMap);

      if (options.format === 'json') {
        console.log(JSON.stringify(diff, null, 2));
      } else {
        const report = renderReport(diff, {
          baseLabel: base,
          targetLabel: target,
          useColor: options.color,
        });
        console.log(report);
      }

      // Exit with code 1 if there are differences (useful for CI pipelines)
      if (hasDifferences(diff)) {
        process.exit(1);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

/**
 * `reconcile` command — merge two .env files with a chosen strategy.
 *
 * Usage:
 *   stackdiff reconcile <base> <target> [options]
 */
program
  .command('reconcile <base> <target>')
  .description('Reconcile two .env files and write merged output')
  .option('-s, --strategy <strategy>', 'Merge strategy: base-wins | target-wins | union', 'union')
  .option('-o, --output <file>', 'Write reconciled output to a file instead of stdout')
  .action((base: string, target: string, options: { strategy: string; output?: string }) => {
    const validStrategies = ['base-wins', 'target-wins', 'union'];
    if (!validStrategies.includes(options.strategy)) {
      console.error(`Error: Invalid strategy "${options.strategy}". Choose from: ${validStrategies.join(', ')}`);
      process.exit(2);
    }

    try {
      const baseMap = loadFromFile(path.resolve(base));
      const targetMap = loadFromFile(path.resolve(target));

      const merged = reconcileEnvMaps(baseMap, targetMap, {
        strategy: options.strategy as 'base-wins' | 'target-wins' | 'union',
      });

      const serialized = serializeEnvMap(merged);

      if (options.output) {
        fs.writeFileSync(path.resolve(options.output), serialized, 'utf-8');
        console.log(`Reconciled output written to ${options.output}`);
      } else {
        console.log(serialized);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

/**
 * `check` command — compare a .env file against the current process environment.
 *
 * Usage:
 *   stackdiff check <file> [options]
 */
program
  .command('check <file>')
  .description('Check a .env file against the current process environment')
  .option('--no-color', 'Disable colored output')
  .action((file: string, options: { color: boolean }) => {
    try {
      const fileMap = loadFromFile(path.resolve(file));
      const envMap = loadFromEnv();

      const diff = diffEnvMaps(fileMap, envMap);
      const report = renderReport(diff, {
        baseLabel: file,
        targetLabel: 'process.env',
        useColor: options.color,
      });

      console.log(report);

      if (hasDifferences(diff)) {
        process.exit(1);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

program.parse(process.argv);
