import { AssetMediaStatus, type AssetMediaResponseDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState } from '$lib/types';
import * as utils from '$lib/utils';
import { fileUploadHandler, LARGE_FILE_WARNING_THRESHOLD } from './file-uploader';

describe('fileUploadHandler large file warning', () => {
  const mockUploadResponse = { id: 'mock-id', status: AssetMediaStatus.Created } as AssetMediaResponseDto;

  const createFile = (name: string, size: number) => {
    const file = new File(['content'], name, { type: 'image/jpeg', lastModified: 1 });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(uploadManager, 'getExtensions').mockReturnValue(['.jpg']);
    vi.spyOn(toastManager, 'warning').mockImplementation(() => 'toast-id' as never);
    vi.spyOn(utils, 'uploadRequest').mockResolvedValue({ status: 200, data: mockUploadResponse });
    uploadAssetsStore.reset();
    authManager.reset();
  });

  it('should warn for files larger than 1 GB without blocking the upload', async () => {
    await fileUploadHandler({ files: [createFile('big.jpg', LARGE_FILE_WARNING_THRESHOLD + 1)] });

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toastManager.warning).mock.calls[0][0]).toBe('upload_large_file_warning');
    expect(utils.uploadRequest).toHaveBeenCalledTimes(1);

    const items = get(uploadAssetsStore);
    expect(items).toHaveLength(1);
    expect(items[0].state).toBe(UploadState.DONE);
  });

  it('should not warn for files of 1 GB or smaller', async () => {
    await fileUploadHandler({
      files: [createFile('exact.jpg', LARGE_FILE_WARNING_THRESHOLD), createFile('small.jpg', 1024)],
    });

    expect(toastManager.warning).not.toHaveBeenCalled();
    expect(utils.uploadRequest).toHaveBeenCalledTimes(2);
  });
});
