import { NextRequest, NextResponse } from 'next/server';
import { getPublicApiBaseUrl } from '@/lib/public-api-url';
import { getGroqSupportReply, normalizeChatHistory } from '@/lib/groq-support-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backendBase(): string {
  try {
    return getPublicApiBaseUrl();
  } catch {
    return 'https://tipico-backend.onrender.com/api';
  }
}

async function replyViaBackend(body: unknown): Promise<Response> {
  return fetch(`${backendBase()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

/** Support chat: Groq on Vercel/local when GROQ_API_KEY is set, else proxy to Render. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const history = normalizeChatHistory(
    body && typeof body === 'object' ? (body as { messages?: unknown }).messages : undefined
  );

  if (history.length === 0) {
    return NextResponse.json({ error: 'At least one message is required' }, { status: 400 });
  }

  const last = history[history.length - 1];
  if (last.role !== 'user') {
    return NextResponse.json({ error: 'The latest message must be from the user' }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();

  // Prefer direct Groq from Next.js (fast, works in local dev with frontend .env.local).
  if (groqKey) {
    try {
      const reply = await getGroqSupportReply(history, groqKey);
      return NextResponse.json({ reply });
    } catch (err) {
      console.error('[support-chat] Groq direct:', err);
      const message = err instanceof Error ? err.message : 'Chat request failed';
      const isAuth =
        message.toLowerCase().includes('invalid api key') ||
        message.toLowerCase().includes('unauthorized');
      return NextResponse.json(
        {
          error: isAuth
            ? 'Support chat is misconfigured. Please contact the site administrator.'
            : 'Could not get a reply. Please try again.',
        },
        { status: isAuth ? 503 : 502 }
      );
    }
  }

  // Fallback: Express on Render (must have GROQ_API_KEY + /api/chat deployed).
  try {
    const upstream = await replyViaBackend({ messages: history });
    const text = await upstream.text();

    if (upstream.ok) {
      return new NextResponse(text, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 404 = old backend without chat route
    if (upstream.status === 404 || upstream.status === 503) {
      return NextResponse.json(
        {
          error:
            'Support chat is not configured yet. Add GROQ_API_KEY to your deployment environment.',
        },
        { status: 503 }
      );
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[support-chat] backend proxy:', err);
    return NextResponse.json(
      {
        error:
          'Support chat is unavailable. Add GROQ_API_KEY to Vercel or your Render API service.',
      },
      { status: 502 }
    );
  }
}
