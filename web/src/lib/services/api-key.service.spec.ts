import { deleteApiKey, type ApiKeyResponseDto } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleDeleteApiKey } from '$lib/services/api-key.service';
import { getFormatter } from '$lib/utils/i18n';

vi.mock('@immich/ui', () => ({
  modalManager: { show: vi.fn(), showDialog: vi.fn() },
  toastManager: { primary: vi.fn(), warning: vi.fn() },
}));

vi.mock('@immich/sdk');

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn(),
  getPreferredLocale: vi.fn(),
}));

vi.mock('$lib/utils/handle-error', () => ({ handleError: vi.fn() }));

vi.mock('$lib/modals/ApiKeyCreateModal.svelte', () => ({ default: {} }));
vi.mock('$lib/modals/ApiKeyUpdateModal.svelte', () => ({ default: {} }));

describe('ApiKeyService', () => {
  describe('handleDeleteApiKey', () => {
    const apiKey = { id: 'key-id', name: 'my key', permissions: [], createdAt: '', updatedAt: '' } as ApiKeyResponseDto;

    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(getFormatter).mockResolvedValue(((key: string, options?: { values?: { name?: string } }) =>
        options?.values?.name ? `${key}:${options.values.name}` : key) as never);
      vi.spyOn(eventManager, 'emit').mockImplementation(() => {});
    });

    it('should ask for confirmation before deleting', async () => {
      vi.mocked(modalManager.showDialog).mockResolvedValue(true);

      await handleDeleteApiKey(apiKey);

      expect(modalManager.showDialog).toHaveBeenCalledWith({ prompt: 'delete_api_key_prompt:my key' });
      expect(deleteApiKey).toHaveBeenCalledWith({ id: 'key-id' });
      expect(eventManager.emit).toHaveBeenCalledWith('ApiKeyDelete', apiKey);
      expect(toastManager.primary).toHaveBeenCalled();
    });

    it('should not delete the key when the confirmation is cancelled', async () => {
      vi.mocked(modalManager.showDialog).mockResolvedValue(false);

      await handleDeleteApiKey(apiKey);

      expect(modalManager.showDialog).toHaveBeenCalledTimes(1);
      expect(deleteApiKey).not.toHaveBeenCalled();
      expect(eventManager.emit).not.toHaveBeenCalled();
      expect(toastManager.primary).not.toHaveBeenCalled();
    });
  });
});
