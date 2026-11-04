import { vitest } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { getAssetActions } from '$lib/services/asset.service';
import { setSharedLink } from '$lib/utils';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

vitest.mock('@immich/ui', () => ({
  toastManager: {
    primary: vitest.fn(),
  },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('@immich/sdk');

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: {} } as never,
  };
});

describe('getAssetActions download button title', () => {
  beforeEach(() => {
    authManager.setPreferences(preferencesFactory.build());
  });

  it('should include the original file name in the download button title', () => {
    const ownerId = 'owner';
    authManager.setUser(userAdminFactory.build({ id: ownerId }));
    setSharedLink(sharedLinkFactory.build({ allowDownload: true }));
    const asset = assetFactory.build({ ownerId, originalFileName: 'holiday.jpg' });

    const $t = vitest.fn((key: string, options?: { values?: Record<string, unknown> }) =>
      key === 'download_asset_filename' ? `Download ${options?.values?.filename}` : key,
    );
    const { SharedLinkDownload, Download } = getAssetActions($t as never, asset);

    expect(SharedLinkDownload.title).toBe('Download holiday.jpg');
    // the menu item keeps the plain label
    expect(Download.title).toBe('download');
  });
});
