import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  Snapshot,
} from '../envSnapshot';

const sampleEnv = { API_URL: 'https://example.com', DEBUG: 'true' };

describe('createSnapshot', () => {
  it('creates a snapshot with correct fields', () => {
    const snap = createSnapshot('baseline', 'production', sampleEnv);
    expect(snap.label).toBe('baseline');
    expect(snap.target).toBe('production');
    expect(snap.env).toEqual(sampleEnv);
    expect(snap.timestamp).toBeTruthy();
    expect(new Date(snap.timestamp).toISOString()).toBe(snap.timestamp);
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-snap-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('saves and reloads a snapshot', () => {
    const snap = createSnapshot('v1', 'staging', sampleEnv);
    const filepath = saveSnapshot(snap, tmpDir);
    expect(fs.existsSync(filepath)).toBe(true);
    const loaded = loadSnapshot(filepath);
    expect(loaded).toEqual(snap);
  });

  it('throws when loading a missing file', () => {
    expect(() => loadSnapshot('/nonexistent/path.json')).toThrow('Snapshot file not found');
  });

  it('throws on invalid snapshot format', () => {
    const bad = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(bad, JSON.stringify({ foo: 'bar' }), 'utf-8');
    expect(() => loadSnapshot(bad)).toThrow('Invalid snapshot format');
  });
});

describe('listSnapshots', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-list-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array for missing directory', () => {
    expect(listSnapshots('/no/such/dir')).toEqual([]);
  });

  it('lists saved snapshots sorted by timestamp', () => {
    const s1 = createSnapshot('a', 'prod', { A: '1' });
    const s2 = createSnapshot('b', 'prod', { B: '2' });
    saveSnapshot(s1, tmpDir);
    saveSnapshot(s2, tmpDir);
    const list = listSnapshots(tmpDir);
    expect(list.length).toBe(2);
    expect(list[0].timestamp <= list[1].timestamp).toBe(true);
  });

  it('skips invalid json files gracefully', () => {
    fs.writeFileSync(path.join(tmpDir, 'corrupt.json'), 'not-json', 'utf-8');
    expect(() => listSnapshots(tmpDir)).not.toThrow();
    expect(listSnapshots(tmpDir).length).toBe(0);
  });
});
