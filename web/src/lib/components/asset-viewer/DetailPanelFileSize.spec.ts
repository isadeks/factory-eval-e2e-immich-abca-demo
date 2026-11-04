import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanel from './DetailPanel.svelte';

describe('DetailPanel file size', () => {
  it('shows the original file size in a human readable unit', () => {
    const asset = assetFactory.build({ exifInfo: { fileSizeInByte: 3 * 2 ** 20 + 2 ** 19 } });

    render(TestWrapper, { component: DetailPanel, componentProps: { asset } });

    expect(screen.getByTestId('detail-panel-file-size')).toHaveTextContent('3.5 MiB');
  });

  it('shows kilobytes for small files', () => {
    const asset = assetFactory.build({ exifInfo: { fileSizeInByte: 512 * 2 ** 10 } });

    render(TestWrapper, { component: DetailPanel, componentProps: { asset } });

    expect(screen.getByTestId('detail-panel-file-size')).toHaveTextContent('512 KiB');
  });

  it('does not show a file size when it is unknown', () => {
    const asset = assetFactory.build({ exifInfo: {} });

    render(TestWrapper, { component: DetailPanel, componentProps: { asset } });

    expect(screen.queryByTestId('detail-panel-file-size')).not.toBeInTheDocument();
  });
});
