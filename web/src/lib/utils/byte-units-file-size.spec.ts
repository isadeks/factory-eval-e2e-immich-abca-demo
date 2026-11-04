import { getByteUnitString } from '$lib/utils/byte-units';

describe('getByteUnitString (file sizes)', () => {
  it.each([
    { bytes: 0, expected: '0 B' },
    { bytes: 999, expected: '999 B' },
    { bytes: 1024, expected: '1 KiB' },
    { bytes: 1536, expected: '1.5 KiB' },
    { bytes: 2_500_000, expected: '2.4 MiB' },
    { bytes: 5 * 2 ** 30, expected: '5 GiB' },
  ])('formats $bytes bytes as $expected', ({ bytes, expected }) => {
    expect(getByteUnitString(bytes, 'en-US')).toEqual(expected);
  });

  it('respects the locale decimal separator', () => {
    expect(getByteUnitString(1536, 'de-DE')).toEqual('1,5 KiB');
  });
});
