import { fetchWithTimeout } from './fetch-with-timeout';
import { HOME_INITIAL_VISIBLE } from './home-fixture-list';
import { getPublicApiBaseUrl } from './public-api-url';
import type { Fixture, FixtureMeta, League, Odd } from './api';

export type ServerHomeBundle = {
  fixtures: Fixture[];
  odds: Record<number, Odd[]>;
  meta: FixtureMeta | null;
  topLeagues: League[];
};

const EMPTY_META: FixtureMeta = { total: 0, days: [], countries: [] };

function parseOddsMap(raw: unknown): Record<number, Odd[]> {
  const out: Record<number, Odd[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, rows] of Object.entries(raw as Record<string, unknown>)) {
    const id = parseInt(key, 10);
    if (Number.isFinite(id) && Array.isArray(rows)) out[id] = rows as Odd[];
  }
  return out;
}

export function emptyServerHomeBundle(): ServerHomeBundle {
  return { fixtures: [], odds: {}, meta: null, topLeagues: [] };
}

const SSR_MAX_WAIT_MS = 4_000;

/** Server-only: first paint bundle for home (100 matches + dropdown counts). */
export async function fetchServerHomeBundle(): Promise<ServerHomeBundle> {
  let base: string;
  try {
    base = getPublicApiBaseUrl();
  } catch {
    return { fixtures: [], odds: {}, meta: null, topLeagues: [] };
  }

  const limit = HOME_INITIAL_VISIBLE;

  try {
    const [homeRes, metaRes, leaguesRes] = await Promise.all([
      fetchWithTimeout(`${base}/fixtures/home?limit=${limit}`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 120 },
        timeoutMs: 12_000,
      }),
      fetchWithTimeout(`${base}/fixtures/meta?has_odds=1`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 120 },
        timeoutMs: 12_000,
      }),
      fetchWithTimeout(`${base}/leagues/top`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
        timeoutMs: 8_000,
      }),
    ]);

    let fixtures: Fixture[] = [];
    let odds: Record<number, Odd[]> = {};

    if (homeRes.ok) {
      const home = (await homeRes.json()) as { fixtures?: Fixture[]; odds?: unknown };
      fixtures = Array.isArray(home.fixtures) ? home.fixtures : [];
      odds = parseOddsMap(home.odds);
    }

    let meta: FixtureMeta | null = null;
    if (metaRes.ok) {
      const m = (await metaRes.json()) as FixtureMeta;
      meta =
        m && typeof m.total === 'number' && Array.isArray(m.days)
          ? m
          : EMPTY_META;
    }

    let topLeagues: League[] = [];
    if (leaguesRes.ok) {
      const rows = await leaguesRes.json();
      topLeagues = Array.isArray(rows) ? rows.slice(0, 15) : [];
    }

    return { fixtures, odds, meta, topLeagues };
  } catch {
    return emptyServerHomeBundle();
  }
}

/** Do not block the HTML longer than SSR_MAX_WAIT_MS — client/cache fills in if slow. */
export async function fetchServerHomeBundleFast(): Promise<ServerHomeBundle> {
  return Promise.race([
    fetchServerHomeBundle(),
    new Promise<ServerHomeBundle>((resolve) => {
      setTimeout(() => resolve(emptyServerHomeBundle()), SSR_MAX_WAIT_MS);
    }),
  ]);
}
