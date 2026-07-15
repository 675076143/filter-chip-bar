import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadPresets,
  loadRecent,
  savePresets,
  saveRecent,
  type RecentSearch,
  type SearchPreset,
} from '../types';
import { getUsageCount, incrementUsage } from '../progressive';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() { return values.size; },
  } satisfies Storage;
}

describe('local storage persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('round-trips presets in an isolated namespace', () => {
    const presets: SearchPreset[] = [
      { id: '1', name: 'Passing', searchText: 'Status:Passing', tab: -1, createdAt: 1 },
    ];
    savePresets('orders', presets);
    expect(loadPresets('orders')).toEqual(presets);
    expect(loadPresets('tickets')).toEqual([]);
  });

  it('limits recent searches to eight entries', () => {
    const recent: RecentSearch[] = Array.from({ length: 10 }, (_, index) => ({
      text: `query-${index}`,
      total: index,
      timestamp: index,
      frequency: 1,
    }));
    saveRecent('orders', recent);
    expect(loadRecent('orders')).toEqual(recent.slice(0, 8));
  });

  it('falls back safely when stored JSON is corrupt', () => {
    localStorage.setItem('orders:presets', '{invalid');
    localStorage.setItem('orders:recent', '{invalid');
    expect(loadPresets('orders')).toEqual([]);
    expect(loadRecent('orders')).toEqual([]);
  });

  it('tracks usage without throwing when storage writes fail', () => {
    expect(incrementUsage('orders')).toBe(1);
    expect(getUsageCount('orders')).toBe(1);
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('quota'); });
    expect(incrementUsage('orders')).toBe(2);
  });

  it('uses an injected storage adapter instead of global localStorage', () => {
    const storage = createStorage();
    const presets: SearchPreset[] = [
      { id: 'custom', name: 'Custom', searchText: 'Status:Passing', tab: -1, createdAt: 1 },
    ];
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('global disabled'); });

    savePresets('orders', presets, storage);
    expect(loadPresets('orders', storage)).toEqual(presets);
    expect(incrementUsage('orders', storage)).toBe(1);
    expect(getUsageCount('orders', storage)).toBe(1);
  });
});
