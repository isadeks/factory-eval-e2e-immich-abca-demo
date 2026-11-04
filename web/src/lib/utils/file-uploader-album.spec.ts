import { AssetMediaStatus, type AssetMediaResponseDto, type UserAdminResponseDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { addAssetsToAlbums } from '$lib/services/album.service';
import { uploadAssetsStore } from '$lib/stores/upload';
import * as utils from '$lib/utils';
import { fileUploadHandler } from './file-uploader';

vi.mock('$lib/services/album.service', () => ({ addAssetsToAlbums: vi.fn() }));

vi.mock('@immich/ui', () => ({
  toastManager: { primary: vi.fn(), warning: vi.fn() },
}));

describe('fileUploadHandler album toast', () => {
  const user = { id: 'user-123', email: 'test@example.com' } as UserAdminResponseDto;
  const response = { id: 'mock-id', status: AssetMediaStatus.Created } as AssetMediaResponseDto;
  const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' })];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(uploadManager, 'getExtensions').mockReturnValue(['.jpg']);
    uploadAssetsStore.reset();
    authManager.reset();
    authManager.setUser(user);
    vi.spyOn(utils, 'uploadRequest').mockResolvedValue({ status: 200, data: response });
  });

  it('should show one toast after uploading assets into an album', async () => {
    vi.mocked(addAssetsToAlbums).mockResolvedValue(true);

    await fileUploadHandler({ files, albumId: 'album-1' });

    expect(toastManager.primary).toHaveBeenCalledOnce();
    expect(toastManager.primary).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'assets_added_to_album_count' }),
      { timeout: 5000 },
    );
  });

  it('should not show a toast when adding to the album fails', async () => {
    vi.mocked(addAssetsToAlbums).mockResolvedValue(false);

    await fileUploadHandler({ files, albumId: 'album-1' });

    expect(toastManager.primary).not.toHaveBeenCalled();
  });

  it('should not show a toast when no album is targeted', async () => {
    await fileUploadHandler({ files });

    expect(addAssetsToAlbums).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
  });
});
