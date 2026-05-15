import { getPublicApiBaseUrl } from './public-api-url';

const API_URL = getPublicApiBaseUrl();

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface League {
  id: number;
  country_id: number;
  name: string;
  logo: string;
  type: string;
  season_current: string;
  api_league_id: number;
  is_top: boolean;
  top_rank: number;
  country_name: string;
  flag_url: string;
}

export interface Fixture {
  id: number;
  league_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  status: string;
  minute: number;
  home_score: number;
  away_score: number;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  league_logo: string;
  api_league_id: number;
  country_name: string;
  flag_url: string;
  venue_name: string;
  venue_city: string;
  referee: string;
}


export interface LiveMatch {
  id: number;
  fixture_id: number;
  status: string;
  minute: number;
  home_score: number;
  away_score: number;
  is_active: boolean;
  match_date: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  api_league_id: number;
  country_name: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  founded: number;
  league_name: string;
  country_name: string;
}

export interface Odd {
  id: number;
  fixture_id: number;
  bookmaker_name: string;
  bookmaker_logo: string;
  market_name: string;
  market_key: string;
  selection: string;
  odd_value: number;
}

export type TicketByCodeSelection = {
  fixture_id: number | null;
  selection: string;
  odd: number;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  league_name: string;
  market_name: string;
  fixture_status: string;
  manual_kickoff_at?: string | null;
  manual_end_at?: string | null;
  is_manual?: boolean;
  blocked: boolean;
};

export type TicketByCodeResponse = {
  ticket_code: string;
  selections: TicketByCodeSelection[];
  can_place: boolean;
  message: string | null;
};

/** Admin manual preset ticket list row (matches GET /admin/manual-tickets). */
export type AdminManualTicketRow = {
  id: number;
  ticket_code: string;
  total_odds: number;
  status: string;
  created_at: string;
  selections: Array<{
    selection: string;
    odd: number;
    result: string | null;
    home_team: string;
    away_team: string;
    league_name: string;
    market_name: string;
    manual_kickoff_at: string;
    manual_end_at: string;
  }>;
};




export const api = {
  getLeagues: () => fetchAPI<League[]>('/leagues'),
  getTopLeagues: () => fetchAPI<League[]>('/leagues/top'),
  getLeague: (id: number) => fetchAPI<League>(`/leagues/${id}`),

  getFixtures: (params?: { league_id?: number; status?: string; date?: string; page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.league_id) search.set('league_id', String(params.league_id));
    if (params?.status) search.set('status', params.status);
    if (params?.date) search.set('date', params.date);
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return fetchAPI<Fixture[]>(`/fixtures${qs ? `?${qs}` : ''}`);
  },
  getFixture: (id: number) => fetchAPI<Fixture>(`/fixtures/${id}`),
  getLiveFixtures: () => fetchAPI<Fixture[]>('/fixtures/live'),

  getLiveMatches: () => fetchAPI<LiveMatch[]>('/live/matches'),

  getTeams: (leagueId?: number) => {
    const qs = leagueId ? `?league_id=${leagueId}` : '';
    return fetchAPI<Team[]>(`/teams${qs}`);
  },
  getTeam: (id: number) => fetchAPI<Team>(`/teams/${id}`),

  getOdds: (fixtureId: number, opts?: { refresh?: boolean }) => {
    const bust = opts?.refresh ? `?_=${Date.now()}` : '';
    return fetchAPI<Odd[]>(`/odds/fixture/${fixtureId}${bust}`);
  },

  getWalletBalance: async (): Promise<{ balance: number; currency: string }> => {
    if (typeof window === 'undefined') {
      throw new Error('Wallet is only available in the browser');
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/betting/wallet`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error((data.message as string) || `Could not load wallet (${res.status})`);
    }
    return {
      balance: parseFloat(String(data.balance ?? 0)),
      currency: (data.currency as string) || 'ETB',
    };
  },

  getTicketByCode: async (rawCode: string): Promise<TicketByCodeResponse> => {
    const normalized = String(rawCode || '')
      .trim()
      .replace(/^#/i, '')
      .replace(/^code:\s*/i, '')
      .trim();
    if (!normalized) {
      throw new Error('Enter a ticket code');
    }
    const res = await fetch(`${API_URL}/betting/ticket-code/${encodeURIComponent(normalized)}`, {
      cache: 'no-store',
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error((data.message as string) || `Lookup failed (${res.status})`);
    }
    return data as unknown as TicketByCodeResponse;
  },

  getBetHistory: async (userId: number) => {
    if (typeof window === 'undefined') {
      throw new Error('Bet history is only available in the browser');
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/betting/history/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Could not load bet history (${res.status})`);
    return res.json();
  },

  placeBet: async (payload: {
    user_id: number;
    stake: number;
    /** Only true when slip was loaded from a ticket code; then server blocks non–pre-match legs. */
    enforce_prematch_from_ticket?: boolean;
    selections: Array<{
      fixture_id: number | null;
      market_id: number | null;
      selection: string;
      odd: number;
      home_team: string;
      away_team: string;
      home_logo?: string;
      away_logo?: string;
      league_name: string;
      market_name: string;
      manual_kickoff_at?: string;
      manual_end_at?: string;
    }>;
  }) => {
    if (typeof window === 'undefined') {
      throw new Error('placeBet is only available in the browser');
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/betting/bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error((data.message as string) || `Bet failed (${res.status})`);
    }
    return data as Record<string, unknown> & {
      wallet_balance?: number;
      currency?: string;
      ticket_code?: string | null;
    };
  },

  getAdminManualTicketClubs: async (date?: string) => {
    if (typeof window === 'undefined') throw new Error('Admin API is browser-only');
    const token = localStorage.getItem('token');
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_URL}/admin/manual-ticket-clubs${qs}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error((data.message as string) || `Clubs failed (${res.status})`);
    return data as {
      date: string;
      clubs: Array<{
        id: number;
        name: string;
        logo: string;
        league_name: string | null;
        country_code: string | null;
        country_name: string | null;
      }>;
      small_leagues: Array<{
        id: number;
        league_name: string | null;
        country_code: string | null;
        country_name: string | null;
      }>;
    };
  },

  createAdminManualTicket: async (
    matches: Array<{
      home_team_id: number;
      away_team_id: number;
      selection: string;
      odd: number;
      market_name?: string;
      manual_kickoff_at: string;
      manual_end_at: string;
    }>
  ) => {
    if (typeof window === 'undefined') throw new Error('Admin API is browser-only');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/manual-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ matches }),
      cache: 'no-store',
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error((data.message as string) || `Create failed (${res.status})`);
    return data as { id: number; ticket_code: string; total_odds: number; created_at: string };
  },

  listAdminManualTickets: async (): Promise<AdminManualTicketRow[]> => {
    if (typeof window === 'undefined') throw new Error('Admin API is browser-only');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/manual-tickets`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    const text = await res.text();
    let parsed: unknown = [];
    try {
      parsed = text ? JSON.parse(text) : [];
    } catch {
      parsed = [];
    }
    if (!res.ok) {
      const msg =
        parsed && typeof parsed === 'object' && parsed !== null && 'message' in parsed
          ? String((parsed as { message: unknown }).message)
          : `List failed (${res.status})`;
      throw new Error(msg);
    }
    if (!Array.isArray(parsed)) return [];
    return parsed as AdminManualTicketRow[];
  },
};
