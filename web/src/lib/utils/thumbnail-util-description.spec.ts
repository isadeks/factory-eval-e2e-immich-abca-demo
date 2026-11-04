import { init, register, waitLocale } from 'svelte-i18n';
import { get } from 'svelte/store';
import { getAltText } from '$lib/utils/thumbnail-util';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { assetFactory, timelineAssetFactory } from '@test-data/factories/asset-factory';

describe('getAltText with description', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('uses the description as alt text when present', () => {
    const asset = timelineAssetFactory.build({ description: 'A dog playing on the beach' });
    expect(get(getAltText)(asset)).toBe('A dog playing on the beach');
  });

  it.each([undefined, null, '', ' '.repeat(3)])(
    'falls back to the generated alt text when description is %j',
    (description) => {
      const asset = timelineAssetFactory.build({ description, isVideo: false, city: null, country: null, people: [] });
      expect(get(getAltText)(asset)).toMatch(/^Image taken on /);
    },
  );

  it('carries the exif description over when converting an asset response', () => {
    const response = assetFactory.build({ exifInfo: { description: '  Sunset at the lake  ' } });
    const timelineAsset = toTimelineAsset(response);
    expect(timelineAsset.description).toBe('Sunset at the lake');
    expect(get(getAltText)(timelineAsset)).toBe('Sunset at the lake');
  });
});
