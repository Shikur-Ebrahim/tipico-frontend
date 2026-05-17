import { getPublicApiBaseUrl } from './public-api-url';

/**
 * Browser: same-origin BFF routes (Vercel edge cache, ~fast).
 * Server: direct Render API.
 */
export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    if (normalized.startsWith('/fixtures/bootstrap')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/home-bootstrap${qs}`;
    }
    if (normalized.startsWith('/fixtures/home')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/home-feed${qs}`;
    }
    if (normalized.startsWith('/fixtures/meta/summary')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/fixtures-meta-summary${qs}`;
    }
    const fixtureDetail = normalized.match(/^\/fixtures\/(\d+)$/);
    if (fixtureDetail) {
      return `/api/fixtures/${fixtureDetail[1]}`;
    }
    const oddsFixture = normalized.match(/^\/odds\/fixture\/(\d+)/);
    if (oddsFixture) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/odds/fixture/${oddsFixture[1]}${qs}`;
    }
    if (normalized.startsWith('/fixtures/meta')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/fixtures-meta${qs}`;
    }
  }

  return `${getPublicApiBaseUrl()}${normalized}`;
}
