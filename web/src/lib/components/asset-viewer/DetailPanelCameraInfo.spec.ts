import type { AssetResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanel from './DetailPanel.svelte';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  getAllAlbums: vi.fn().mockResolvedValue([]),
  getAssetInfo: vi.fn(),
}));

const renderPanel = (asset: AssetResponseDto) =>
  render(TestWrapper, { component: DetailPanel, componentProps: { asset } });

describe('DetailPanel camera info', () => {
  it('shows ISO and exposure time when present', () => {
    const asset = assetFactory.build({ exifInfo: { iso: 800, exposureTime: '1/250' } });
    renderPanel(asset);

    expect(screen.getByText('1/250 s')).toBeInTheDocument();
    expect(screen.getByText('ISO 800')).toBeInTheDocument();
    expect(screen.getByTitle('exposure_time')).toHaveTextContent('1/250 s');
    expect(screen.getByTitle('iso')).toHaveTextContent('ISO 800');
  });

  it('shows only ISO when exposure time is missing', () => {
    const asset = assetFactory.build({ exifInfo: { iso: 100 } });
    renderPanel(asset);

    expect(screen.getByText('ISO 100')).toBeInTheDocument();
    expect(screen.queryByText(/ s$/)).not.toBeInTheDocument();
  });

  it('shows only exposure time when ISO is missing', () => {
    const asset = assetFactory.build({ exifInfo: { exposureTime: '1/60' } });
    renderPanel(asset);

    expect(screen.getByText('1/60 s')).toBeInTheDocument();
    expect(screen.queryByText(/^ISO/)).not.toBeInTheDocument();
  });

  it('hides the camera row when neither is present', () => {
    const asset = assetFactory.build({ exifInfo: {} });
    renderPanel(asset);

    expect(screen.queryByText(/^ISO/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ s$/)).not.toBeInTheDocument();
  });
});
