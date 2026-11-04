import { toastManager } from '@immich/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { uploadAssetsStore } from '$lib/stores/upload';
import * as utils from '$lib/utils';
import { fileUploadHandler } from './file-uploader';

describe('fileUploader error toast', () => {
  const mockFile = new File(['content'], 'broken-photo.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(uploadManager, 'getExtensions').mockReturnValue(['.jpg']);
    uploadAssetsStore.reset();
    authManager.reset();
  });

  it('should include the file name in the error toast when an upload fails', async () => {
    const dangerSpy = vi.spyOn(toastManager, 'danger').mockReturnValue(undefined as never);
    vi.spyOn(utils, 'uploadRequest').mockRejectedValue(new Error('Upload failed'));

    await fileUploadHandler({ files: [mockFile] });

    expect(dangerSpy).toHaveBeenCalledTimes(1);
    expect(dangerSpy.mock.calls[0][0]).toContain('broken-photo.jpg');
  });
});
