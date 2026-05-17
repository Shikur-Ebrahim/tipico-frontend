import type { FixtureDayCounts, FixtureMeta } from './api';

export function metaFromDayCounts(counts: FixtureDayCounts): FixtureMeta {
  return {
    total: counts.total,
    days: counts.days,
    countries: [{ name: 'All countries', count: counts.total, flag_url: null }],
  };
}

/** Merge fast /meta/summary into existing meta (keeps country breakdown when loaded). */
export function mergeDayCountsIntoMeta(
  prev: FixtureMeta | null,
  counts: FixtureDayCounts
): FixtureMeta {
  if (!prev) return metaFromDayCounts(counts);
  const extraCountries = prev.countries.filter((c) => c.name !== 'All countries');
  return {
    total: counts.total,
    days: counts.days,
    countries: [
      { name: 'All countries', count: counts.total, flag_url: null },
      ...extraCountries,
    ],
  };
}
