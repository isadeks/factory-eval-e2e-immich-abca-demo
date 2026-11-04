import { vitest } from 'vitest';
import { getAssetActions } from '$lib/services/asset.service';
import { copyToClipboard } from '$lib/utils';
import { assetFactory } from '@test-data/factories/asset-factory';

vitest.mock('@immich/ui', () => ({
  toastManager: { primary: vitest.fn(), info: vitest.fn() },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('@immich/sdk');

vitest.mock('$lib/utils', async () => {
  const originalModule = await vitest.importActual('$lib/utils');
  return {
    ...originalModule,
    copyToClipboard: vitest.fn(),
  };
});

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: {} } as never,
  };
});

describe('AssetService CopyFileName', () => {
  it('should use the copy_file_name translation key as title', () => {
    const asset = assetFactory.build({ originalFileName: 'IMG_0001.jpg' });
    const { CopyFileName } = getAssetActions(((key: unknown) => String(key)) as never, asset);
    expect(CopyFileName.title).toBe('copy_file_name');
  });

  it('should copy the original file name to the clipboard', async () => {
    const asset = assetFactory.build({ originalFileName: 'IMG_0001.jpg' });
    const { CopyFileName } = getAssetActions(() => '', asset);
    await CopyFileName.onAction(CopyFileName);
    expect(copyToClipboard).toHaveBeenCalledWith('IMG_0001.jpg');
  });

  it('should be shown only when the asset has a file name', () => {
    const named = getAssetActions(() => '', assetFactory.build({ originalFileName: 'a.jpg' }));
    const unnamed = getAssetActions(() => '', assetFactory.build({ originalFileName: '' }));
    expect(named.CopyFileName.$if?.()).toBe(true);
    expect(unnamed.CopyFileName.$if?.()).toBe(false);
  });
});
