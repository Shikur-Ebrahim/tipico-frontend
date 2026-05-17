'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { Fixture, Odd } from '../lib/api';
import { prefetchMatchDetailOdds, writeMatchDetailCache } from '../lib/match-detail-cache';

type Props = ComponentProps<typeof Link> & {
  fixture: Fixture;
  odds?: Odd[];
};

export default function MatchDetailLink({ fixture, odds = [], href, onPointerEnter, onPointerDown, ...rest }: Props) {
  const matchHref = href ?? `/matches/${fixture.id}`;

  return (
    <Link
      href={matchHref}
      prefetch
      onPointerEnter={(e) => {
        prefetchMatchDetailOdds(fixture.id);
        onPointerEnter?.(e);
      }}
      onPointerDown={(e) => {
        writeMatchDetailCache(fixture, odds);
        prefetchMatchDetailOdds(fixture.id);
        onPointerDown?.(e);
      }}
      {...rest}
    />
  );
}
