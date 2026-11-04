import { getThumbnailTitle } from '$lib/utils/thumbnail-util';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';

describe('getThumbnailTitle', () => {
  const asset = timelineAssetFactory.build({
    localDateTime: { year: 2024, month: 1, day: 15, hour: 14, minute: 30, second: 0, millisecond: 0 },
  });

  it('includes the capture date and time in local time', () => {
    expect(getThumbnailTitle(asset, 'en-US')).toBe('Jan 15, 2024, 2:30 PM');
  });

  it('formats according to the given locale', () => {
    expect(getThumbnailTitle(asset, 'de')).toContain('15. Jan. 2024');
  });
});
