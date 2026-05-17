import { api, type Fixture, type FixtureMeta, type Odd } from './api';
import { HOME_INITIAL_VISIBLE } from './home-fixture-list';
import { homeFeedCacheKey, peekHomeFeedCache, writeHomeFeedCache } from './home-feed-cache';

export type HomeBootstrapSnapshot = {
  fixtures: Fixture[];
  odds: Record<number, Odd[]>;
  meta: FixtureMeta | null;
};

const DEFAULT_KEY = homeFeedCacheKey('all', 'All countries', null);

let memorySnapshot: HomeBootstrapSnapshot | null = null;
let prefetchPromise: Promise<HomeBootstrapSnapshot> | null = null;

function snapshotFromCache(): HomeBootstrapSnapshot | null {
  const cached = peekHomeFeedCache(DEFAULT_KEY);
  if (!cached?.fixtures.length) return null;
  return {
    fixtures: cached.fixtures,
    odds: cached.odds,
    meta: cached.meta,
  };
}

/** Call as early as possible on the client so fetch runs during JS parse. */
export function startHomeFeedPrefetch(): void {
  if (typeof window === 'undefined') return;
  if (prefetchPromise) return;

  const fromCache = snapshotFromCache();
  if (fromCache) {
    memorySnapshot = fromCache;
    return;
  }

  prefetchPromise = (async () => {
    const feed = await api.getHomeFeed({ limit: HOME_INITIAL_VISIBLE });
    const snap: HomeBootstrapSnapshot = {
      fixtures: feed.fixtures,
      odds: feed.odds,
      meta: null,
    };
    if (snap.fixtures.length > 0) {
      writeHomeFeedCache(DEFAULT_KEY, snap.fixtures, snap.odds, null);
      memorySnapshot = snap;
    }
    void api.getFixturesMeta({ has_odds: true }).then((meta) => {
      if (!meta?.total) return;
      const base = memorySnapshot;
      if (base?.fixtures.length) {
        memorySnapshot = { ...base, meta };
        writeHomeFeedCache(DEFAULT_KEY, base.fixtures, base.odds, meta);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('tipico:home-meta', { detail: meta })
        );
      }
    });
    return snap;
  })();
}

export function peekHomeBootstrap(): HomeBootstrapSnapshot | null {
  if (memorySnapshot?.fixtures.length) return memorySnapshot;
  return snapshotFromCache();
}

export function consumeHomeFeedPrefetch(): Promise<HomeBootstrapSnapshot> | null {
  if (prefetchPromise) return prefetchPromise;
  const cached = peekHomeBootstrap();
  if (cached) return Promise.resolve(cached);
  startHomeFeedPrefetch();
  return prefetchPromise;
}
