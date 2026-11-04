import { writable } from 'svelte/store';
import { getAlbumMonthRange } from './date-time';

vitest.mock('$lib/stores/preferences.store', () => ({
  locale: writable('en'),
}));

describe('getAlbumMonthRange', () => {
  it('should show month and year of the earliest and latest asset', () => {
    expect(getAlbumMonthRange({ startDate: '2024-01-15T10:00:00.000Z', endDate: '2024-03-20T10:00:00.000Z' })).toEqual(
      'Jan 2024 – Mar 2024',
    );
  });

  it('should include both years when the range spans years', () => {
    expect(getAlbumMonthRange({ startDate: '2023-12-31T23:00:00.000Z', endDate: '2024-02-01T00:00:00.000Z' })).toEqual(
      'Dec 2023 – Feb 2024',
    );
  });

  it('should collapse to a single month when start and end are in the same month', () => {
    expect(getAlbumMonthRange({ startDate: '2024-01-01T00:00:00.000Z', endDate: '2024-01-31T00:00:00.000Z' })).toEqual(
      'Jan 2024',
    );
  });

  it('should work with only a start date', () => {
    expect(getAlbumMonthRange({ startDate: '2024-01-15T00:00:00.000Z' })).toEqual('Jan 2024');
  });

  it('should return an empty string without dates', () => {
    expect(getAlbumMonthRange({})).toEqual('');
  });
});
