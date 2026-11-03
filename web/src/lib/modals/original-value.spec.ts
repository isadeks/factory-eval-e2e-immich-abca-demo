import { DateTime } from 'luxon';
import { formatOriginalDate, isDateChanged, toLocalInputValue } from './original-value';

describe('original-value', () => {
  const original = DateTime.fromISO('2024-05-01T10:30:00.000');

  it('formats the original date', () => {
    expect(formatOriginalDate(original)).toBe('2024-05-01T10:30:00.000');
    expect(toLocalInputValue(original)).toBe('2024-05-01T10:30:00.000');
  });

  it('is not changed for the same value, regardless of precision', () => {
    expect(isDateChanged(original, '2024-05-01T10:30:00.000')).toBe(false);
    expect(isDateChanged(original, '2024-05-01T10:30')).toBe(false);
  });

  it('is changed for a different value', () => {
    expect(isDateChanged(original, '2024-05-01T10:31')).toBe(true);
    expect(isDateChanged(original, '2024-05-01T10:30:00.001')).toBe(true);
  });

  it('is not changed for an invalid value', () => {
    expect(isDateChanged(original, '')).toBe(false);
  });
});
