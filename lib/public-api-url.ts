/**
 * Express routes live under `/api/*`. Set `NEXT_PUBLIC_API_URL` in Vercel to your
 * Render API (e.g. `https://your-api.onrender.com` or `.../api` — `/api` is appended if missing).
 */
const PRODUCTION_API_FALLBACK = 'https://tipico-backend.onrender.com/api';

export function getPublicApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      return PRODUCTION_API_FALLBACK;
    }
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. In Vercel → Project → Settings → Environment Variables, add it with your Render API base (https://…onrender.com or …/api). Redeploy after saving.'
    );
  }
  const base = raw.replace(/\/+$/, '');
  if (/\/api$/i.test(base)) {
    return base;
  }
  return `${base}/api`;
}
