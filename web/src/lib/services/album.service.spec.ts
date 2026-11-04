import { getAllSharedLinks } from '@immich/sdk';
import { vitest } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { getAlbumActions, handleCopyAlbumSharedLink } from '$lib/services/album.service';
import { copyToClipboard } from '$lib/utils';
import { albumFactory } from '@test-data/factories/album-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

vitest.mock('@immich/sdk');

vitest.mock('@immich/ui', () => ({
  modalManager: { show: vitest.fn() },
  toastManager: { primary: vitest.fn(), info: vitest.fn() },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn().mockResolvedValue((key: string) => key),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('$lib/utils', async () => {
  const originalModule = await vitest.importActual('$lib/utils');
  return { ...originalModule, copyToClipboard: vitest.fn() };
});

vitest.mock('$lib/managers/server-config-manager.svelte', () => ({
  serverConfigManager: { value: { externalDomain: 'http://localhost:2283' }, init: vitest.fn() },
}));

vitest.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: { init: vitest.fn(), loadFeatureFlags: vitest.fn(), value: {} },
}));

describe('AlbumService', () => {
  const $t = ((key: string) => key) as never;

  describe('getAlbumActions CopyLink', () => {
    const owner = userAdminFactory.build();

    beforeEach(() => {
      authManager.setUser(owner);
    });

    it('should be shown for owned albums that have a shared link', () => {
      const album = albumFactory.build({ hasSharedLink: true, albumUsers: [{ role: 'owner', user: owner }] as never });
      const { CopyLink } = getAlbumActions($t, album);
      expect(CopyLink.$if?.()).toBe(true);
    });

    it('should be hidden for albums without a shared link', () => {
      const album = albumFactory.build({ hasSharedLink: false, albumUsers: [{ role: 'owner', user: owner }] as never });
      const { CopyLink } = getAlbumActions($t, album);
      expect(CopyLink.$if?.()).toBe(false);
    });

    it('should be hidden for albums the user does not own', () => {
      const other = userAdminFactory.build();
      const album = albumFactory.build({ hasSharedLink: true, albumUsers: [{ role: 'owner', user: other }] as never });
      const { CopyLink } = getAlbumActions($t, album);
      expect(CopyLink.$if?.()).toBe(false);
    });
  });

  describe('handleCopyAlbumSharedLink', () => {
    it('should copy the url of the album shared link', async () => {
      const album = albumFactory.build({ hasSharedLink: true });
      vitest.mocked(getAllSharedLinks).mockResolvedValue([sharedLinkFactory.build({ key: 'abc' })]);

      await handleCopyAlbumSharedLink(album);

      expect(getAllSharedLinks).toHaveBeenCalledWith({ albumId: album.id });
      expect(copyToClipboard).toHaveBeenCalledWith('http://localhost:2283/share/abc');
    });

    it('should not copy anything when there is no shared link', async () => {
      vitest.mocked(copyToClipboard).mockClear();
      vitest.mocked(getAllSharedLinks).mockResolvedValue([]);

      await handleCopyAlbumSharedLink(albumFactory.build());

      expect(copyToClipboard).not.toHaveBeenCalled();
    });
  });
});
