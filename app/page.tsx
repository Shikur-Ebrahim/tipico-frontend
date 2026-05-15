import HomePageClient from '../components/home-page-client';
import { api, Fixture, LiveMatch, Odd, League } from '../lib/api';

export const dynamic = 'force-dynamic';

type FeaturedMatch = {
  fixture: Fixture;
  odds: Odd[];
};

async function safeLoad<T>(loader: () => Promise<T>, fallback: T) {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

async function loadPageData() {
  const [liveMatches, upcomingFixtures, topLeagues] = await Promise.all([
    safeLoad(() => api.getLiveMatches(), [] as LiveMatch[]),
    safeLoad(() => api.getFixtures({ limit: 3000 }), [] as Fixture[]),
    safeLoad(() => api.getTopLeagues(), [] as League[]),
  ]);

  const activeFixtures = upcomingFixtures.filter(f => 
    ['NS', 'TBD', '1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status?.toUpperCase() || '')
  );

  const featuredMatches = await Promise.all(
    activeFixtures.slice(0, 10).map(async (fixture) => ({
      fixture,
      odds: await safeLoad(() => api.getOdds(fixture.id), [] as Odd[]),
    }))
  );

  return {
    liveMatches,
    upcomingFixtures,
    topLeagues: topLeagues.slice(0, 15),
    featuredMatches,
  };
}

export default async function Home() {
  const { liveMatches, upcomingFixtures, topLeagues, featuredMatches } = await loadPageData();

  return <HomePageClient liveMatches={liveMatches} upcomingFixtures={upcomingFixtures} topLeagues={topLeagues} featuredMatches={featuredMatches} />;
}
