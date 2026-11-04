import { locale } from '$lib/stores/preferences.store';
import { parseUtcDate } from '$lib/utils/date-time';
import { formatGroupTitle } from '$lib/utils/timeline-util';

describe('formatGroupTitle year display', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    process.env.TZ = 'UTC';
  });

  beforeEach(() => {
    vi.setSystemTime(new Date('2024-07-27T12:00:00Z'));
    locale.set('en');
  });

  afterAll(() => {
    vi.useRealTimers();
    delete process.env.TZ;
  });

  it('omits the year for dates in the current year', () => {
    expect(formatGroupTitle(parseUtcDate('2024-03-15T10:00:00Z'))).toBe('Fri, Mar 15');
    expect(formatGroupTitle(parseUtcDate('2024-01-01T00:00:00Z'))).toBe('Mon, Jan 1');
  });

  it('shows the year for dates in a previous year', () => {
    expect(formatGroupTitle(parseUtcDate('2023-12-31T23:59:59Z'))).toBe('Sun, Dec 31, 2023');
    expect(formatGroupTitle(parseUtcDate('2020-03-15T10:00:00Z'))).toBe('Sun, Mar 15, 2020');
  });

  it('shows the year for dates in a future year', () => {
    expect(formatGroupTitle(parseUtcDate('2025-01-01T00:00:00Z'))).toBe('Wed, Jan 1, 2025');
  });

  it('shows the year for the same month and day in a previous year', () => {
    expect(formatGroupTitle(parseUtcDate('2023-07-27T12:00:00Z'))).toBe('Thu, Jul 27, 2023');
  });

  it('shows the year for a date in the last week that falls in the previous year', () => {
    vi.setSystemTime(new Date('2025-01-02T12:00:00Z'));
    expect(formatGroupTitle(parseUtcDate('2024-12-30T10:00:00Z'))).toBe('Mon, Dec 30, 2024');
  });

  it('still uses the weekday name for the last week within the current year', () => {
    vi.setSystemTime(new Date('2025-01-08T12:00:00Z'));
    expect(formatGroupTitle(parseUtcDate('2025-01-05T10:00:00Z'))).toBe('Sunday');
  });

  it('shows the year according to the locale', () => {
    locale.set('de');
    expect(formatGroupTitle(parseUtcDate('2020-03-15T10:00:00Z'))).toContain('2020');
    expect(formatGroupTitle(parseUtcDate('2024-03-15T10:00:00Z'))).not.toContain('2024');
  });
});
