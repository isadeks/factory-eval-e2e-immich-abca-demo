import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState, type UploadAsset } from '$lib/types';
import UploadPanel from './UploadPanel.svelte';

vi.mock('$lib/utils/wakelock.svelte', () => ({
  acquireWakeLock: vi.fn(),
  releaseWakeLock: vi.fn(),
}));

const makeAsset = (id: string): UploadAsset => ({
  id,
  file: new File(['x'], `${id}.jpg`, { type: 'image/jpeg' }),
  assetId: undefined,
});

describe('UploadPanel', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  beforeEach(() => {
    uploadAssetsStore.reset();
  });

  afterEach(() => {
    uploadAssetsStore.reset();
  });

  it('shows "n of m uploaded" progress text', async () => {
    render(TestWrapper, { component: UploadPanel, componentProps: {} });

    for (let i = 1; i <= 10; i++) {
      uploadAssetsStore.addItem(makeAsset(`asset-${i}`));
    }
    for (let i = 1; i <= 3; i++) {
      uploadAssetsStore.updateItem(`asset-${i}`, { state: UploadState.DONE });
      uploadAssetsStore.track('success');
    }
    await tick();

    await waitFor(() => expect(screen.getByTestId('upload-n-of-m')).toHaveTextContent('3 of 10 uploaded'));
  });

  it('updates as more uploads complete', async () => {
    render(TestWrapper, { component: UploadPanel, componentProps: {} });

    uploadAssetsStore.addItem(makeAsset('a'));
    uploadAssetsStore.addItem(makeAsset('b'));
    await waitFor(() => expect(screen.getByTestId('upload-n-of-m')).toHaveTextContent('0 of 2 uploaded'));

    uploadAssetsStore.updateItem('a', { state: UploadState.DONE });
    uploadAssetsStore.track('success');
    await waitFor(() => expect(screen.getByTestId('upload-n-of-m')).toHaveTextContent('1 of 2 uploaded'));
  });
});
