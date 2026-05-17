import { NextRequest, NextResponse } from 'next/server';
import { getPublicApiBaseUrl } from '@/lib/public-api-url';

export const runtime = 'nodejs';
export const revalidate = 15;

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
  const refresh = req.nextUrl.searchParams.get('refresh');
  const qs = new URLSearchParams();
  if (refresh) qs.set('refresh', refresh);
  if (bust) qs.set('_', bust);
  const query = qs.toString();
  const url = `${backendBase()}/odds/fixture/${fixtureId}${query ? `?${query}` : ''}`;
  const liveRefresh = refresh === '1' || Boolean(bust);

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(liveRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 15 } }),
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': liveRefresh
          ? 'private, no-cache, no-store'
          : 'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
