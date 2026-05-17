import type { Fixture, FixtureMeta, Odd } from './api';

export type HomeFeedCacheEntry = {
  fixtures: Fixture[];
  odds: Record<number, Odd[]>;
  meta: FixtureMeta | null;
  savedAt: number;
};

const STORAGE_PREFIX = 'tipico-home-feed:';
const TTL_MS = 10 * 60 * 1000;

let memoryEntry: { key: string; entry: HomeFeedCacheEntry } | null = null;

export function homeFeedCacheKey(
  day: string,
  country: string,
  leagueId: number | null
): string {
  return `${day}|${country}|${leagueId ?? 'all'}`;
}

function isFresh(entry: HomeFeedCacheEntry | null | undefined): entry is HomeFeedCacheEntry {
  if (!entry?.fixtures?.length) return false;
  return Date.now() - entry.savedAt < TTL_MS;
}

export function peekHomeFeedCache(key: string): HomeFeedCacheEntry | null {
  if (memoryEntry?.key === key && isFresh(memoryEntry.entry)) {
    return memoryEntry.entry;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeFeedCacheEntry;
    if (!isFresh(parsed)) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    memoryEntry = { key, entry: parsed };
    return parsed;
  } catch {
    return null;
  }
}

export function writeHomeFeedCache(
  key: string,
  fixtures: Fixture[],
  odds: Record<number, Odd[]>,
  meta: FixtureMeta | null
): void {
  if (!fixtures.length) return;
  const entry: HomeFeedCacheEntry = {
    fixtures,
    odds,
    meta,
    savedAt: Date.now(),
  };
  memoryEntry = { key, entry };
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota */
  }
}
