import { NextRequest } from 'next/server';

import { proxyAuthToBackend } from '@/lib/auth-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return proxyAuthToBackend('login', await req.text());
}
