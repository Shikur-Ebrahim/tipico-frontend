import HomePageClient from '../components/home-page-client';
import { fetchServerHomeBundleFast } from '../lib/server-home-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { fixtures, odds, meta, topLeagues } = await fetchServerHomeBundleFast();

  return (
    <HomePageClient
      liveMatches={[]}
      upcomingFixtures={fixtures}
      initialOddsMap={odds}
      initialFixtureMeta={meta}
      topLeagues={topLeagues}
      featuredMatches={[]}
    />
  );
}
