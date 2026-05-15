import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, Fixture, Odd } from '../../../lib/api';
import MatchDetailView from '../../../components/match-detail-view';

export const dynamic = 'force-dynamic';

type MatchDetailData = {
  fixture: Fixture | null;
  odds: Odd[];
};

async function safeLoad<T>(loader: () => Promise<T>, fallback: T) {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

async function loadMatchDetail(id: number): Promise<MatchDetailData> {
  const fixture = await safeLoad(() => api.getFixture(id), null as Fixture | null);

  if (!fixture) {
    return {
      fixture: null,
      odds: [],
    };
  }

  const odds = await safeLoad(() => api.getOdds(fixture.id), [] as Odd[]);

  return {
    fixture,
    odds,
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (Number.isNaN(matchId)) {
    notFound();
  }

  const { fixture, odds } = await loadMatchDetail(matchId);

  if (!fixture) {
    notFound();
  }

  return <MatchDetailView initialFixture={fixture} initialOdds={odds} />;
}
