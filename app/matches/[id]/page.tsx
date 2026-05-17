import { api, Fixture, Odd } from '../../../lib/api';
import MatchDetailPageClient from '../../../components/match-detail-page-client';

export const dynamic = 'force-dynamic';

async function tryLoadMatch(id: number): Promise<{ fixture: Fixture | null; odds: Odd[] }> {
  try {
    const fixture = await api.getFixture(id);
    if (!fixture) return { fixture: null, odds: [] };
    const odds = await api.getOdds(fixture.id).catch(() => [] as Odd[]);
    return { fixture, odds: Array.isArray(odds) ? odds : [] };
  } catch {
    return { fixture: null, odds: [] };
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  let initialFixture: Fixture | null = null;
  let initialOdds: Odd[] = [];

  if (Number.isFinite(matchId) && matchId > 0) {
    const loaded = await tryLoadMatch(matchId);
    initialFixture = loaded.fixture;
    initialOdds = loaded.odds;
  }

  return (
    <MatchDetailPageClient
      matchId={Number.isFinite(matchId) ? matchId : NaN}
      initialFixture={initialFixture}
      initialOdds={initialOdds}
    />
  );
}
