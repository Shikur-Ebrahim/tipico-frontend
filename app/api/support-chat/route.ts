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

/** Proxy support chat to Render Express API (keeps GROQ_API_KEY server-side). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${backendBase()}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Support chat is temporarily unavailable. Please try again.' },
      { status: 502 }
    );
  }
}
