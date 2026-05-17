import { getPublicApiBaseUrl } from './public-api-url';

/**
 * Browser: same-origin BFF routes (Vercel edge cache, ~fast).
 * Server: direct Render API.
 */
export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    if (normalized.startsWith('/fixtures/home')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/home-feed${qs}`;
    }
    if (normalized.startsWith('/fixtures/meta/summary')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/fixtures-meta-summary${qs}`;
    }
    if (normalized.startsWith('/fixtures/meta')) {
      const qs = normalized.includes('?') ? normalized.slice(normalized.indexOf('?')) : '';
      return `/api/fixtures-meta${qs}`;
    }
  }

  return `${getPublicApiBaseUrl()}${normalized}`;
}
