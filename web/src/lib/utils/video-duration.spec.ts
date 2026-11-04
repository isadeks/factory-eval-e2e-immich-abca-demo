import { formatVideoDuration } from '$lib/utils/video-duration';

describe('formatVideoDuration', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [59, '0:59'],
    [60, '1:00'],
    [330, '5:30'],
    [754, '12:34'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatVideoDuration(seconds)).toBe(expected);
  });

  it('rounds fractional seconds down', () => {
    expect(formatVideoDuration(5.9)).toBe('0:05');
  });

  it('handles invalid values', () => {
    expect(formatVideoDuration(-3)).toBe('0:00');
    expect(formatVideoDuration(NaN)).toBe('0:00');
  });
});
