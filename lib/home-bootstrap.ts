import { api, type Fixture, type FixtureMeta, type Odd } from './api';
import { mergeDayCountsIntoMeta, metaFromDayCounts } from './fixture-meta-utils';
import { HOME_INITIAL_VISIBLE } from './home-fixture-list';
import {
  homeFeedCacheKey,
  peekHomeFeedCache,
  prefetchHomeCountryFeeds,
  prefetchHomeDayFeeds,
  writeHomeFeedCache,
} from './home-feed-cache';

const PREFETCH_TOP_COUNTRIES = 12;

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
    prefetchHomeDayFeeds(['today', 'tomorrow'], HOME_INITIAL_VISIBLE, (day) =>
      api.getHomeFeed({ limit: HOME_INITIAL_VISIBLE, day })
    );
    void api.getFixturesDayCounts().then((counts) => {
      if (!counts?.days?.length) return;
      const partial = metaFromDayCounts(counts);
      const base = memorySnapshot;
      if (base?.fixtures.length) {
        memorySnapshot = { ...base, meta: partial };
        writeHomeFeedCache(DEFAULT_KEY, base.fixtures, base.odds, partial);
      }
      window.dispatchEvent(new CustomEvent('tipico:home-meta', { detail: partial }));
    });
    void api.getFixturesMeta({ has_odds: true }).then((meta) => {
      if (!meta?.total) return;
      const base = memorySnapshot;
      const merged = base?.meta
        ? mergeDayCountsIntoMeta(base.meta, { total: meta.total, days: meta.days })
        : meta;
      const full = { ...meta, days: merged.days, total: merged.total };
      if (base?.fixtures.length) {
        memorySnapshot = { ...base, meta: full };
        writeHomeFeedCache(DEFAULT_KEY, base.fixtures, base.odds, full);
      }
      window.dispatchEvent(new CustomEvent('tipico:home-meta', { detail: full }));
      const dayIds = full.days?.map((d) => d.id).filter((id) => id !== 'all') ?? [];
      if (dayIds.length) {
        prefetchHomeDayFeeds(dayIds, HOME_INITIAL_VISIBLE, (day) =>
          api.getHomeFeed({ limit: HOME_INITIAL_VISIBLE, day })
        );
      }
      const topCountries = full.countries
        .filter((c) => c.name !== 'All countries' && c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, PREFETCH_TOP_COUNTRIES)
        .map((c) => c.name);
      if (topCountries.length) {
        prefetchHomeCountryFeeds('all', topCountries, HOME_INITIAL_VISIBLE, (params) =>
          api.getHomeFeed({ limit: HOME_INITIAL_VISIBLE, ...params })
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
