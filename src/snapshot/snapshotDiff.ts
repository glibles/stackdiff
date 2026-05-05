import { diffEnvMaps, hasDifferences } from '../diff';
import { Snapshot } from './envSnapshot';

export interface SnapshotDiffResult {
  from: Pick<Snapshot, 'label' | 'timestamp' | 'target'>;
  to: Pick<Snapshot, 'label' | 'timestamp' | 'target'>;
  diff: ReturnType<typeof diffEnvMaps>;
  hasChanges: boolean;
}

export function diffSnapshots(from: Snapshot, to: Snapshot): SnapshotDiffResult {
  const diff = diffEnvMaps(from.env, to.env);
  return {
    from: { label: from.label, timestamp: from.timestamp, target: from.target },
    to: { label: to.label, timestamp: to.timestamp, target: to.target },
    diff,
    hasChanges: hasDifferences(diff),
  };
}

export function formatSnapshotDiffHeader(result: SnapshotDiffResult): string {
  const fromStr = `${result.from.target}@${result.from.label} (${result.from.timestamp})`;
  const toStr = `${result.to.target}@${result.to.label} (${result.to.timestamp})`;
  const status = result.hasChanges ? 'CHANGED' : 'NO CHANGES';
  return `Snapshot diff [${status}]\n  from: ${fromStr}\n  to:   ${toStr}`;
}
