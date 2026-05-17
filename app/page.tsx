import HomePageClient from '../components/home-page-client';

/** Fast first paint: data loads in the browser (Render API is not blocked on Vercel SSR). */
export default function Home() {
  return (
    <HomePageClient liveMatches={[]} upcomingFixtures={[]} topLeagues={[]} featuredMatches={[]} />
  );
}
