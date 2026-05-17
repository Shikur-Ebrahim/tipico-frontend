import { NextResponse } from 'next/server';

import { warmDepositBackend } from '@/lib/deposit-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  await warmDepositBackend();
  return NextResponse.json({ ok: true });
}
