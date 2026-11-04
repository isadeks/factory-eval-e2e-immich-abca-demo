import type { TimelineYearMonth } from '$lib/utils/timeline-util';

const toIndex = ({ year, month }: TimelineYearMonth) => year * 12 + (month - 1);

/** Parses the value of an `<input type="date">` (`YYYY-MM-DD`) into a year/month, or `undefined` if invalid. */
export const parseDateInputValue = (value: string): TimelineYearMonth | undefined => {
  const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return;
  }
  return { year, month };
};

/** Returns the item whose year/month is closest to the target (ties prefer the more recent one). */
export const findClosestMonth = <T extends { yearMonth: TimelineYearMonth }>(
  months: T[],
  target: TimelineYearMonth,
): T | undefined => {
  const targetIndex = toIndex(target);
  let best: T | undefined;
  let bestDistance = Infinity;
  for (const candidate of months) {
    const index = toIndex(candidate.yearMonth);
    const distance = Math.abs(index - targetIndex);
    if (distance < bestDistance || (distance === bestDistance && best && index > toIndex(best.yearMonth))) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
};
