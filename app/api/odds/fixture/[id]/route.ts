import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const fixtureId = parseInt(id, 10);
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: 'Invalid fixture id' }, { status: 400 });
  }

  const bust = req.nextUrl.searchParams.get('_');
  const url = `${backendBase()}/odds/fixture/${fixtureId}${bust ? `?_=${bust}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
