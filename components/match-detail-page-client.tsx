'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell bg-[#0D1117] min-h-screen text-white flex flex-col items-center justify-center gap-4 px-6">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="w-10 h-10 border-2 border-[#FF8C00]/30 border-t-[#FF8C00] rounded-full animate-spin"
      aria-hidden
    />
  );
}

export default function MatchDetailPageClient({
  matchId,
  initialFixture,
  initialOdds,
}: Props) {
  const [fixture, setFixture] = useState<Fixture | null>(initialFixture);
  const [odds, setOdds] = useState<Odd[]>(initialOdds);
  const [loading, setLoading] = useState(!initialFixture);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(matchId) || matchId <= 0) {
      setError('Invalid match link.');
      setLoading(false);
      return;
    }

    if (initialFixture) {
      setFixture(initialFixture);
      setOdds(initialOdds);
      setLoading(false);
      if (initialOdds.length === 0) {
        void api.getOdds(matchId).then((rows) => {
          if (Array.isArray(rows) && rows.length > 0) setOdds(rows);
        });
      }
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const cached = findInHomeCaches(matchId);
      if (cached.fixture && !cancelled) {
        setFixture(cached.fixture);
        if (cached.odds.length > 0) setOdds(cached.odds);
        setLoading(false);
      }

      const [nextFixture, nextOdds] = await Promise.all([
        api.getFixture(matchId),
        api.getOdds(matchId),
      ]);

      if (cancelled) return;

      if (nextFixture) {
        setFixture(nextFixture);
        setOdds(Array.isArray(nextOdds) && nextOdds.length > 0 ? nextOdds : cached.odds);
        setError(null);
      } else if (!cached.fixture) {
        setError('This match could not be loaded. It may have ended or been removed.');
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [matchId, initialFixture, initialOdds]);

  if (!Number.isFinite(matchId) || matchId <= 0) {
    return (
      <Shell>
        <p className="text-sm text-[#8B949E] text-center">Invalid match link.</p>
        <Link href="/" className="text-[#FF8C00] font-semibold text-sm">
          Back to home
        </Link>
      </Shell>
    );
  }

  if (loading && !fixture) {
    return (
      <Shell>
        <Spinner />
        <p className="text-sm text-[#8B949E]">Loading match…</p>
      </Shell>
    );
  }

  if (error && !fixture) {
    return (
      <Shell>
        <p className="text-sm text-[#8B949E] text-center max-w-xs">{error}</p>
        <Link href="/" className="text-[#FF8C00] font-semibold text-sm">
          Back to home
        </Link>
      </Shell>
    );
  }

  if (!fixture) {
    return (
      <Shell>
        <p className="text-sm text-[#8B949E] text-center">Match not found.</p>
        <Link href="/" className="text-[#FF8C00] font-semibold text-sm">
          Back to home
        </Link>
      </Shell>
    );
  }

  return <MatchDetailView initialFixture={fixture} initialOdds={odds} />;
}
