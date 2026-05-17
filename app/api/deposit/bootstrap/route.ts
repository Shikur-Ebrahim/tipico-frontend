import { NextRequest } from 'next/server';

import { proxyDepositBootstrap } from '@/lib/deposit-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return proxyDepositBootstrap(req.headers.get('authorization'));
}
