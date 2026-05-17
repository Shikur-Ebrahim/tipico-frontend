import HomePageClient from '../components/home-page-client';
import { fetchServerHomeBundle } from '../lib/server-home-data';

export const revalidate = 120;

export default async function Home() {
  const { fixtures, odds, meta, topLeagues } = await fetchServerHomeBundle();

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
