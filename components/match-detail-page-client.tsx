'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Fixture, Odd } from '../lib/api';
import { homeFeedCacheKey, peekHomeFeedCache } from '../lib/home-feed-cache';
import MatchDetailView from './match-detail-view';

type Props = {
  matchId: number;
  initialFixture: Fixture | null;
  initialOdds: Odd[];
};

function findInHomeCaches(id: number): { fixture: Fixture | null; odds: Odd[] } {
  if (typeof window === 'undefined') return { fixture: null, odds: [] };
  const keys = [
    homeFeedCacheKey('all', 'All countries', null),
    homeFeedCacheKey('today', 'All countries', null),
    homeFeedCacheKey('tomorrow', 'All countries', null),
  ];
  for (const key of keys) {
    const cached = peekHomeFeedCache(key);
    const hit = cached?.fixtures.find((f) => f.id === id);
    if (hit && cached) {
      return { fixture: hit, odds: cached.odds[id] ?? [] };
    }
  }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k?.startsWith('tipico-home-feed:')) continue;
      const raw = sessionStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        fixtures?: Fixture[];
        odds?: Record<string, Odd[]>;
      };
      const hit = parsed.fixtures?.find((f) => f.id === id);
      if (hit) {
        const odds = parsed.odds?.[String(id)] ?? parsed.odds?.[id] ?? [];
        return { fixture: hit, odds };
      }
    }
  } catch {
    /* ignore */
  }
  return { fixture: null, odds: [] };
}

const SESSION_PREFIX = 'tipico-match-snap:';

function readSessionSnapshot(id: number): { fixture: Fixture | null; odds: Odd[] } {
  if (typeof window === 'undefined') return { fixture: null, odds: [] };
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${id}`);
    if (!raw) return { fixture: null, odds: [] };
    const parsed = JSON.parse(raw) as { fixture?: Fixture; odds?: Odd[] };
    if (parsed.fixture?.id === id) {
      return { fixture: parsed.fixture, odds: parsed.odds ?? [] };
    }
  } catch {
    /* ignore */
  }
  return { fixture: null, odds: [] };
}

export function stashMatchForDetail(fixture: Fixture, odds: Odd[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `${SESSION_PREFIX}${fixture.id}`,
      JSON.stringify({ fixture, odds })
    );
  } catch {
    /* ignore */
  }
}

function resolveInstant(matchId: number, initialFixture: Fixture | null, initialOdds: Odd[]) {
  if (initialFixture) {
    return { fixture: initialFixture, odds: initialOdds };
  }
  if (typeof window === 'undefined') {
    return { fixture: null as Fixture | null, odds: [] as Odd[] };
  }
  const session = readSessionSnapshot(matchId);
  if (session.fixture) return session;
  return findInHomeCaches(matchId);
}

export default function MatchDetailPageClient({
  matchId,
  initialFixture,
  initialOdds,
}: Props) {
  const instant = resolveInstant(matchId, initialFixture, initialOdds);
  const [fixture, setFixture] = useState<Fixture | null>(instant.fixture);
  const [odds, setOdds] = useState<Odd[]>(instant.odds);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(matchId) || matchId <= 0) {
      setFetchDone(true);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const [nextFixture, nextOdds] = await Promise.all([
        api.getFixture(matchId),
        api.getOdds(matchId),
      ]);
      if (cancelled) return;
      if (nextFixture) {
        setFixture(nextFixture);
        setOdds(Array.isArray(nextOdds) ? nextOdds : []);
      }
      setFetchDone(true);
    };

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (!Number.isFinite(matchId) || matchId <= 0) {
    return (
      <ErrorShell message="Invalid match link.">
        <Link href="/" className="text-[#FF8C00] font-semibold text-sm">
          Back to home
        </Link>
      </ErrorShell>
    );
  }

  if (fixture) {
    return <MatchDetailView initialFixture={fixture} initialOdds={odds} />;
  }

  if (!fetchDone) {
    return <div className="site-shell bg-[#0D1117] min-h-screen" />;
  }

  return (
    <ErrorShell message="Match not found.">
      <Link href="/" className="text-[#FF8C00] font-semibold text-sm">
        Back to home
      </Link>
    </ErrorShell>
  );
}

function ErrorShell({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell bg-[#0D1117] min-h-screen text-white flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-sm text-[#8B949E] text-center max-w-xs">{message}</p>
      {children}
    </div>
  );
}
