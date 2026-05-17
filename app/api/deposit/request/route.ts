import { NextRequest } from 'next/server';

import { getPublicApiBaseUrl } from '@/lib/public-api-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backendBase(): string {
  try {
    return getPublicApiBaseUrl();
  } catch {
    return 'https://tipico-backend.onrender.com/api';
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.text();
  try {
    const upstream = await fetch(`${backendBase()}/user/deposit-request`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[deposit/request] proxy:', err);
    return Response.json({ message: 'Could not submit deposit' }, { status: 502 });
  }
}
