'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Odd, Fixture } from '../lib/api';
import { isMatchClosedForBetting } from '../lib/match-status';
import { useBetSlip } from '../lib/betslip';

type MatchOddsClientProps = {
  odds: Odd[];
  fixture: Fixture;
};

const sortOrder: Record<string, number> = {
  home: 1,
  '1': 1,
  draw: 2,
  x: 2,
  away: 3,
  '2': 3,
};

const CHIP_TABS = ['Match Winner', 'Home/Away', 'Second Half Winner'] as const;

function normMarket(name: string) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isMainGoalsOverUnder(name: string) {
  const n = normMarket(name);
  if (n === 'goals over/under') return true;
  return (
    n.includes('goals over/under') &&
    !n.includes('first half') &&
    !n.includes('second half') &&
    !n.includes('1st half') &&
    !n.includes('2nd half')
  );
}

function findDefaultOpenMarket(names: string[]): string | null {
  const exact = names.find((n) => normMarket(n) === 'goals over/under');
  if (exact) return exact;
  const main = names.find(isMainGoalsOverUnder);
  if (main) return main;
  return names[0] ?? null;
}

function marketSortRank(name: string): number {
  const n = normMarket(name);
  if (n === 'match winner') return 0;
  if (n === 'home/away') return 1;
  if (n.includes('second half') && n.includes('winner')) return 2;
  if (isMainGoalsOverUnder(name)) return 3;
  if (n.includes('goals over/under') && n.includes('first half')) return 4;
  if (n.includes('goals over/under') && (n.includes('second half') || n.includes('2nd half')))
    return 5;
  if (n.includes('ht/ft')) return 6;
  if (n.includes('goals over/under')) return 7;
  return 50;
}

function sortMarketNames(names: string[]) {
  return [...names].sort((a, b) => {
    const ra = marketSortRank(a);
    const rb = marketSortRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

function chipTabForMarket(name: string): (typeof CHIP_TABS)[number] | null {
  const n = normMarket(name);
  if (n === 'match winner') return 'Match Winner';
  if (n === 'home/away') return 'Home/Away';
  if (n.includes('second half') && n.includes('winner')) return 'Second Half Winner';
  return null;
}

function getSelectionName(selection: string, fixture: Fixture) {
  const sel = selection.toLowerCase();
  if (sel === 'home' || sel === '1') return fixture.home_team_name;
  if (sel === 'away' || sel === '2') return fixture.away_team_name;
  if (sel === 'x') return 'Draw';
  return selection;
}

function sortOdds(odds: Odd[]) {
  return [...odds].sort((a, b) => {
    const orderA = sortOrder[a.selection.toLowerCase()] || 99;
    const orderB = sortOrder[b.selection.toLowerCase()] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.selection.localeCompare(b.selection);
  });
}

function sortOverUnderOdds(odds: Odd[]) {
  return [...odds].sort((a, b) => {
    const sa = a.selection.toLowerCase();
    const sb = b.selection.toLowerCase();
    const overA = sa.startsWith('over') ? 0 : 1;
    const overB = sb.startsWith('over') ? 0 : 1;
    if (overA !== overB) return overA - overB;
    const lineA = parseFloat(sa.replace(/[^\d.]/g, '')) || 0;
    const lineB = parseFloat(sb.replace(/[^\d.]/g, '')) || 0;
    if (lineA !== lineB) return lineA - lineB;
    return sa.localeCompare(sb);
  });
}

function oddsForMarket(marketOdds: Odd[], marketName: string) {
  if (isMainGoalsOverUnder(marketName) || normMarket(marketName).includes('goals over/under')) {
    return sortOverUnderOdds(marketOdds);
  }
  return sortOdds(marketOdds);
}

export default function MatchOddsClient({ odds, fixture }: MatchOddsClientProps) {
  const [activeTab, setActiveTab] = useState<string>('All');
  const { addBet, isSelected } = useBetSlip();
  const scrollRef = useRef<HTMLDivElement>(null);
  const collapseInitRef = useRef(false);

  const markets = useMemo(() => {
    const map = new Map<string, Odd[]>();
    for (const odd of odds) {
      if (!map.has(odd.market_name)) map.set(odd.market_name, []);
      map.get(odd.market_name)!.push(odd);
    }
    return map;
  }, [odds]);

  const marketNames = useMemo(
    () => sortMarketNames(Array.from(markets.keys())),
    [markets]
  );

  const [collapsedMarkets, setCollapsedMarkets] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (collapseInitRef.current || marketNames.length === 0) return;
    collapseInitRef.current = true;
    const defaultOpen = findDefaultOpenMarket(marketNames);
    const collapsed = new Set<string>();
    for (const name of marketNames) {
      if (name !== defaultOpen) collapsed.add(name);
    }
    setCollapsedMarkets(collapsed);
  }, [marketNames]);

  const chipTabs = useMemo(() => {
    const found = new Set<string>();
    for (const name of marketNames) {
      const chip = chipTabForMarket(name);
      if (chip) found.add(chip);
    }
    return CHIP_TABS.filter((t) => found.has(t));
  }, [marketNames]);

  const scrollCarousel = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  const resolveMarketForTab = (tab: string): string | null => {
    if (tab === 'All') return null;
    const exact = marketNames.find((m) => normMarket(m) === normMarket(tab));
    if (exact) return exact;
    if (tab === 'Second Half Winner') {
      return (
        marketNames.find((m) => {
          const n = normMarket(m);
          return n.includes('second half') && n.includes('winner');
        }) ?? null
      );
    }
    return marketNames.find((m) => chipTabForMarket(m) === tab) ?? null;
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'All') return;
    const market = resolveMarketForTab(tab);
    if (!market) return;
    setCollapsedMarkets((prev) => {
      const next = new Set(prev);
      next.delete(market);
      return next;
    });
  };

  const toggleMarket = (marketName: string) => {
    setCollapsedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(marketName)) next.delete(marketName);
      else next.add(marketName);
      return next;
    });
  };

  const displayedMarkets = useMemo(() => {
    const entries = marketNames.map((name) => [name, markets.get(name)!] as const);
    if (activeTab === 'All') return entries;
    const market = resolveMarketForTab(activeTab);
    if (!market) return entries;
    return entries.filter(([name]) => name === market);
  }, [activeTab, marketNames, markets]);

  const isFinished = isMatchClosedForBetting(fixture);
  const isLiveInPlay =
    !isFinished &&
    ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes((fixture.status || '').toUpperCase());

  return (
    <>
      <div className="sticky top-14 z-30 bg-[#0D1117] pt-4 pb-3">
        {isLiveInPlay ? (
          <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[#16A34A]/90">
            Live odds refresh ~30s — prices follow the server database
          </p>
        ) : null}
        <div className="relative">
          <button type="button" onClick={() => scrollCarousel('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black transition-all shadow-lg" aria-label="Scroll left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" onClick={() => scrollCarousel('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black transition-all shadow-lg" aria-label="Scroll right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar gap-2 px-8">
            <button type="button" onClick={() => selectTab('All')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${activeTab === 'All' ? 'bg-[#FF8C00] text-[#0D1117] shadow-md' : 'bg-[#161B22] text-[#8B949E] border border-[#30363D] hover:text-white'}`}>
              All
            </button>
            {chipTabs.map((tab) => (
              <button key={tab} type="button" onClick={() => selectTab(tab)} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[#FF8C00] text-[#0D1117] shadow-md' : 'bg-[#161B22] text-[#8B949E] border border-[#30363D] hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 pb-6 space-y-3 mt-2">
        {displayedMarkets.map(([marketName, marketOdds]) => {
          const isCollapsed = collapsedMarkets.has(marketName);
          const rows = oddsForMarket(marketOdds, marketName);
          return (
            <div key={marketName} className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleMarket(marketName)}
                className="w-full bg-[#FF8C00] px-3.5 py-2.5 flex items-center justify-between text-white cursor-pointer select-none"
              >
                <span className="text-[13px] font-bold tracking-wide text-left">{marketName}</span>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
              </button>
              {!isCollapsed && (
                <div className="flex flex-col p-[2px] bg-white gap-[2px]">
                  {rows.map((odd) => {
                    const betId = `${fixture.id}-${marketName}-${odd.selection}`;
                    const selected = isSelected(betId);
                    return (
                      <button
                        key={odd.id}
                        type="button"
                        disabled={isFinished}
                        onClick={() => {
                          if (isFinished) return;
                          addBet({
                            id: betId,
                            fixtureId: fixture.id,
                            homeTeam: fixture.home_team_name,
                            awayTeam: fixture.away_team_name,
                            league: fixture.league_name,
                            market: marketName,
                            selection: getSelectionName(odd.selection, fixture),
                            odds: Number(odd.odd_value),
                            homeLogo: fixture.home_team_logo,
                            awayLogo: fixture.away_team_logo,
                          });
                        }}
                        className={`flex items-center justify-between px-3.5 py-[10px] transition-all rounded-[5px] ${
                          isFinished
                            ? 'bg-[#F1F5F9] cursor-not-allowed opacity-70'
                            : selected
                              ? 'bg-[#FF8C00]'
                              : 'bg-[#E8EDF5] hover:bg-[#DDE4EE]'
                        }`}
                      >
                        <span className={`text-[13px] font-medium ${isFinished ? 'text-[#94A3B8]' : selected ? 'text-white font-bold' : 'text-[#1A202C]'}`}>
                          {getSelectionName(odd.selection, fixture)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {selected && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          <span className={`text-[14px] font-black ${isFinished ? 'text-[#94A3B8]' : selected ? 'text-white' : 'text-[#1A202C]'}`}>
                            {isFinished ? 'CLOSED' : odd.odd_value}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {markets.size === 0 && (
          <div className="text-center py-10 text-[#8B949E] flex flex-col items-center gap-3">
            <p className="text-[14px] font-bold text-white mb-1">No Markets Open</p>
            <p className="text-xs">Betting odds are not yet available for this match.</p>
          </div>
        )}
      </div>
    </>
  );
}
