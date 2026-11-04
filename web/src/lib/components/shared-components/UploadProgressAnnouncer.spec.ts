import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState } from '$lib/types';
import UploadProgressAnnouncer from './UploadProgressAnnouncer.svelte';

describe('UploadProgressAnnouncer', () => {
  beforeAll(async () => {
    register('en-US', () =>
      Promise.resolve({ upload_progress: 'Remaining {remaining} - Processed {processed}/{total}' }),
    );
    await init({ fallbackLocale: 'en-US' });
    await waitLocale('en-US');
  });

  afterEach(() => {
    uploadAssetsStore.reset();
  });

  const addFile = (id: string) => uploadAssetsStore.addItem({ id, file: { name: `${id}.jpg`, size: 1 } as File });

  it('renders a polite, atomic live region that is empty when nothing is uploading', () => {
    render(UploadProgressAnnouncer);
    const region = screen.getByTestId('upload-progress-live-region');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toBeEmptyDOMElement();
  });

  it('announces and updates upload progress', async () => {
    render(UploadProgressAnnouncer);
    const region = screen.getByTestId('upload-progress-live-region');

    addFile('a');
    addFile('b');
    await expect.poll(() => region.textContent?.trim()).toBe('Remaining 2 - Processed 0/2');

    uploadAssetsStore.updateItem('a', { state: UploadState.DONE });
    await expect.poll(() => region.textContent?.trim()).toBe('Remaining 1 - Processed 1/2');
  });
});
