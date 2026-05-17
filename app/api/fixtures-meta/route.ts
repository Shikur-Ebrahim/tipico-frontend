import { NextRequest, NextResponse } from 'next/server';
import { getPublicApiBaseUrl } from '@/lib/public-api-url';

export const runtime = 'nodejs';
export const revalidate = 45;

function backendBase(): string {
  try {
    return getPublicApiBaseUrl();
  } catch {
    return 'https://tipico-backend.onrender.com/api';
  }
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const url = `${backendBase()}/fixtures/meta${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 45 },
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json(
      { total: 0, days: [], countries: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
      }
    );
  }
}
