/**
 * Express routes live under `/api/*`. Production env often sets only the host
 * (e.g. https://tipico-api.onrender.com) — append `/api` so fetches hit `/api/fixtures`, not `/fixtures`.
 */
export function getPublicApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').trim();
  const base = raw.replace(/\/+$/, '');
  if (/\/api$/i.test(base)) {
    return base;
  }
  return `${base}/api`;
}
