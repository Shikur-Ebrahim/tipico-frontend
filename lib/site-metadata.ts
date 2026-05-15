/** Canonical site URL for metadata / Open Graph (override on Vercel if needed). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://www.tipicoet.bet';

export const SITE_NAME = 'Tipico Betting';

export const SITE_DESCRIPTION =
  'Tipico Betting — one of the world’s most trusted sports betting platforms. Live football odds, secure deposits, and fast withdrawals.';

/** Official Tipico brand logo (public/logo.jpg). */
export const SITE_LOGO_PATH = '/logo.jpg';
