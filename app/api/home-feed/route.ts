import { NextRequest, NextResponse } from 'next/server';
import { getPublicApiBaseUrl } from '@/lib/public-api-url';

export const runtime = 'nodejs';
export const revalidate = 30;

function backendBase(): string {
  try {
    return getPublicApiBaseUrl();
  } catch {
    return 'https://tipico-backend.onrender.com/api';
  }
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const url = `${backendBase()}/fixtures/home${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json(
      { fixtures: [], odds: {} },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
      }
    );
  }
}
