import { formatUptime } from '$lib/utils/uptime';

describe('formatUptime', () => {
  it('formats seconds', () => {
    expect(formatUptime(42, 'en')).toBe('42 sec');
  });

  it('formats minutes and seconds', () => {
    expect(formatUptime(125, 'en')).toBe('2 min, 5 sec');
  });

  it('formats hours and minutes', () => {
    expect(formatUptime(5 * 3600 + 12 * 60 + 59, 'en')).toBe('5 hr, 12 min');
  });

  it('formats days and hours', () => {
    expect(formatUptime(2 * 86_400 + 3 * 3600 + 1800, 'en')).toBe('2 days, 3 hr');
  });

  it('floors fractional values and clamps negatives to zero', () => {
    expect(formatUptime(59.9, 'en')).toBe('59 sec');
    expect(formatUptime(-5, 'en')).toBe('0 sec');
  });
});
