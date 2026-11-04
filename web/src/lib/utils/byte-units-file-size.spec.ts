import { formatFileSize } from '$lib/utils/byte-units';

describe('formatFileSize', () => {
  it.each([
    { bytes: 999, expected: '999 B' },
    { bytes: 1024, expected: '1 KiB' },
    { bytes: 1536, expected: '1.5 KiB' },
    { bytes: 2_500_000, expected: '2.4 MiB' },
    { bytes: 5 * 2 ** 30, expected: '5 GiB' },
  ])('formats $bytes bytes as $expected', ({ bytes, expected }) => {
    expect(formatFileSize(bytes, 'en-US')).toEqual(expected);
  });

  it.each([undefined, null, 0, -1, NaN, Infinity])('returns undefined for %s', (bytes) => {
    expect(formatFileSize(bytes, 'en-US')).toBeUndefined();
  });

  it('respects the locale decimal separator', () => {
    expect(formatFileSize(1536, 'de-DE')).toEqual('1,5 KiB');
  });
});
