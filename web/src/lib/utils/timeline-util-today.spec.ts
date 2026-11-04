import { isTimelineDateToday } from '$lib/utils/timeline-util';

describe('isTimelineDateToday', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 6, 27, 12, 0, 0));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('is true for the current day', () => {
    expect(isTimelineDateToday({ year: 2024, month: 7, day: 27 })).toBe(true);
  });

  it('is false for yesterday and tomorrow', () => {
    expect(isTimelineDateToday({ year: 2024, month: 7, day: 26 })).toBe(false);
    expect(isTimelineDateToday({ year: 2024, month: 7, day: 28 })).toBe(false);
  });

  it('is false for the same day in another month or year', () => {
    expect(isTimelineDateToday({ year: 2024, month: 6, day: 27 })).toBe(false);
    expect(isTimelineDateToday({ year: 2023, month: 7, day: 27 })).toBe(false);
  });
});
