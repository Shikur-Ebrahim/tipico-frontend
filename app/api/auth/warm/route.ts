import { NextResponse } from 'next/server';

import { warmAuthBackend } from '@/lib/auth-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Wake Render/DB before the user submits login or signup. */
export async function GET() {
  await warmAuthBackend();
  return NextResponse.json({ ok: true });
}
