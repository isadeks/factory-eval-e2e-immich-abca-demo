import { emptyTrash, getAssetStatistics } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { vitest } from 'vitest';
import { handleEmptyTrash } from '$lib/services/trash.service';
import { getFormatter } from '$lib/utils/i18n';

vitest.mock('@immich/ui', () => ({
  modalManager: { showDialog: vitest.fn() },
  toastManager: { primary: vitest.fn() },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('@immich/sdk');

describe('TrashService', () => {
  describe('handleEmptyTrash', () => {
    const $t = vitest.fn().mockReturnValue('formatted');

    beforeEach(() => {
      vitest.clearAllMocks();
      vitest.mocked(getFormatter).mockResolvedValue($t);
    });

    it('should include the number of trashed items in the confirmation', async () => {
      vitest.mocked(getAssetStatistics).mockResolvedValue({ images: 3, videos: 2, total: 5 });
      vitest.mocked(modalManager.showDialog).mockResolvedValue(false);

      await handleEmptyTrash();

      expect(getAssetStatistics).toHaveBeenCalledWith({ isTrashed: true });
      expect($t).toHaveBeenCalledWith('empty_trash_confirmation', { values: { count: 5 } });
      expect(modalManager.showDialog).toHaveBeenCalledWith({ prompt: 'formatted' });
    });

    it('should not empty the trash when the confirmation is cancelled', async () => {
      vitest.mocked(getAssetStatistics).mockResolvedValue({ images: 1, videos: 0, total: 1 });
      vitest.mocked(modalManager.showDialog).mockResolvedValue(false);

      await handleEmptyTrash();

      expect(emptyTrash).not.toHaveBeenCalled();
    });

    it('should empty the trash when the confirmation is accepted', async () => {
      vitest.mocked(getAssetStatistics).mockResolvedValue({ images: 1, videos: 0, total: 1 });
      vitest.mocked(modalManager.showDialog).mockResolvedValue(true);
      vitest.mocked(emptyTrash).mockResolvedValue({ count: 1 });

      await handleEmptyTrash();

      expect(emptyTrash).toHaveBeenCalledTimes(1);
    });
  });
});
