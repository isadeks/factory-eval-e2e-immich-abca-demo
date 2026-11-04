import { findClosestMonth, parseDateInputValue } from '$lib/utils/timeline-jump';

describe('parseDateInputValue', () => {
  it('parses a valid date', () => {
    expect(parseDateInputValue('2023-04-15')).toEqual({ year: 2023, month: 4 });
  });

  it('rejects empty and malformed values', () => {
    expect(parseDateInputValue('')).toBeUndefined();
    expect(parseDateInputValue('2023-04')).toBeUndefined();
    expect(parseDateInputValue('2023-13-01')).toBeUndefined();
  });
});

describe('findClosestMonth', () => {
  const months = [
    { yearMonth: { year: 2024, month: 3 } },
    { yearMonth: { year: 2023, month: 11 } },
    { yearMonth: { year: 2022, month: 1 } },
  ];

  it('returns an exact match', () => {
    expect(findClosestMonth(months, { year: 2023, month: 11 })).toBe(months[1]);
  });

  it('returns the nearest month when there is no exact match', () => {
    expect(findClosestMonth(months, { year: 2022, month: 6 })).toBe(months[2]);
    expect(findClosestMonth(months, { year: 2030, month: 1 })).toBe(months[0]);
    expect(findClosestMonth(months, { year: 2000, month: 1 })).toBe(months[2]);
  });

  it('prefers the more recent month on a tie', () => {
    const tie = [{ yearMonth: { year: 2020, month: 1 } }, { yearMonth: { year: 2020, month: 3 } }];
    expect(findClosestMonth(tie, { year: 2020, month: 2 })).toBe(tie[1]);
  });

  it('returns undefined for no months', () => {
    expect(findClosestMonth([], { year: 2020, month: 2 })).toBeUndefined();
  });
});
