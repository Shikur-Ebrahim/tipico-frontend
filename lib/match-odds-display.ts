import type { Odd } from './api';

function isMatchWinnerMarket(o: Odd): boolean {
  const m = (o.market_name || '').toLowerCase();
  const k = (o.market_key || '').toLowerCase();
  return (
    m.includes('match winner') ||
    m.includes('full time result') ||
    m.includes('home/away') ||
    m === '1x2' ||
    m.includes('3way') ||
    k === '1x2' ||
    k.includes('match_winner')
  );
}

function getDisplayOdds(odds: Odd[]) {
  const selections = new Map<string, Odd>();
  for (const odd of odds) {
    const v = Number(odd.odd_value);
    if (!Number.isFinite(v) || v <= 0) continue;
    if (!selections.has(odd.selection)) {
      selections.set(odd.selection, odd);
    }
  }
  return Array.from(selections.values()).slice(0, 3);
}

/** 1X2 / match-winner lines only (no fallback to other markets). */
export function getMatchWinnerDisplayOdds(odds: Odd[]) {
  if (!odds?.length) return [];
  const mw = odds.filter(isMatchWinnerMarket);
  return getDisplayOdds(mw);
}

/** True when fixture has at least two priced 1X2 selections to show. */
export function hasMatchWinnerOdds(odds: Odd[] | undefined): boolean {
  return getMatchWinnerDisplayOdds(odds || []).length >= 2;
}
