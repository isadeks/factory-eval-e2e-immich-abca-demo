import { addAssetsToAlbum, addAssetsToAlbums as addToAlbums, BulkIdErrorReason } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { vitest } from 'vitest';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { addAssetsToAlbums } from '$lib/services/album.service';
import { getFormatter } from '$lib/utils/i18n';

vitest.mock('@immich/ui', () => ({
  toastManager: {
    primary: vitest.fn(),
    info: vitest.fn(),
    warning: vitest.fn(),
    danger: vitest.fn(),
  },
  modalManager: { show: vitest.fn() },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('@immich/sdk', async () => {
  const originalModule = await vitest.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...originalModule,
    addAssetsToAlbum: vitest.fn(),
    addAssetsToAlbums: vitest.fn(),
  };
});

describe('AlbumService', () => {
  describe('addAssetsToAlbums', () => {
    beforeEach(() => {
      vitest.clearAllMocks();
      vitest.mocked(getFormatter).mockResolvedValue(((key: string) => key) as never);
    });

    it('should show a toast after adding assets to a single album', async () => {
      vitest.mocked(addAssetsToAlbum).mockResolvedValue([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: true },
      ]);
      const emit = vitest.spyOn(eventManager, 'emit');

      const result = await addAssetsToAlbums(['album-1'], ['asset-1', 'asset-2'], { notify: true });

      expect(result).toBe(true);
      expect(toastManager.primary).toHaveBeenCalledOnce();
      expect(toastManager.primary).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'assets_added_to_album_count' }),
        expect.anything(),
      );
      expect(emit).toHaveBeenCalledWith('AlbumAddAssets', { assetIds: ['asset-1', 'asset-2'], albumIds: ['album-1'] });
    });

    it('should show a toast after adding assets to multiple albums', async () => {
      vitest.mocked(addToAlbums).mockResolvedValue({ success: true });

      const result = await addAssetsToAlbums(['album-1', 'album-2'], ['asset-1'], { notify: true });

      expect(result).toBe(true);
      expect(toastManager.primary).toHaveBeenCalledWith('assets_added_to_albums_count');
    });

    it('should show an info toast when the assets already are in every album', async () => {
      vitest.mocked(addToAlbums).mockResolvedValue({ success: false, error: BulkIdErrorReason.Duplicate });

      await addAssetsToAlbums(['album-1', 'album-2'], ['asset-1'], { notify: true });

      expect(toastManager.info).toHaveBeenCalledWith('assets_were_part_of_albums_count');
      expect(toastManager.primary).not.toHaveBeenCalled();
    });

    it('should not show a toast when notify is false', async () => {
      vitest.mocked(addAssetsToAlbum).mockResolvedValue([{ id: 'asset-1', success: true }]);

      const result = await addAssetsToAlbums(['album-1'], ['asset-1'], { notify: false });

      expect(result).toBe(true);
      expect(toastManager.primary).not.toHaveBeenCalled();
    });
  });
});
