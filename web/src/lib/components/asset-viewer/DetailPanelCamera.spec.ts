import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanel from './DetailPanel.svelte';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return { ...actual, getAllAlbums: vi.fn().mockResolvedValue([]), getAssetInfo: vi.fn() };
});

describe('DetailPanel camera', () => {
  it('shows the camera make and model when present', () => {
    const asset = assetFactory.build({ exifInfo: { make: 'Canon', model: 'EOS R5' } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    const camera = screen.getByTestId('detail-panel-camera');
    expect(camera).toHaveTextContent('Canon');
    expect(camera).toHaveTextContent('EOS R5');
    expect(screen.getByRole('link', { name: /Canon\s+EOS R5/ })).toBeInTheDocument();
  });

  it('shows only the model when the make is missing', () => {
    const asset = assetFactory.build({ exifInfo: { make: null, model: 'Pixel 8' } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    expect(screen.getByTestId('detail-panel-camera')).toHaveTextContent('Pixel 8');
  });

  it('hides the camera row when neither make nor model is present', () => {
    const asset = assetFactory.build({ exifInfo: { make: null, model: null } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    expect(screen.queryByTestId('detail-panel-camera')).not.toBeInTheDocument();
  });

  it('shows camera and lens on one line separated by a middle dot', () => {
    const asset = assetFactory.build({ exifInfo: { make: 'Canon', model: 'EOS R5', lensModel: 'RF24-70mm F2.8' } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    expect(screen.getByTestId('detail-panel-camera').textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      'Canon EOS R5 · RF24-70mm F2.8',
    );
  });

  it('shows only the lens, without a separator, when there is no camera', () => {
    const asset = assetFactory.build({ exifInfo: { make: null, model: null, lensModel: 'RF24-70mm F2.8' } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    const line = screen.getByTestId('detail-panel-camera');
    expect(line).toHaveTextContent('RF24-70mm F2.8');
    expect(line).not.toHaveTextContent('·');
  });

  it('does not add a separator when there is no lens', () => {
    const asset = assetFactory.build({ exifInfo: { make: 'Canon', model: 'EOS R5', lensModel: null } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    expect(screen.getByTestId('detail-panel-camera')).not.toHaveTextContent('·');
  });

  it('hides the line when neither camera nor lens is present', () => {
    const asset = assetFactory.build({ exifInfo: { make: null, model: null, lensModel: null, iso: 100 } });

    render(TestWrapper, { props: { component: DetailPanel, componentProps: { asset } } });

    expect(screen.queryByTestId('detail-panel-camera')).not.toBeInTheDocument();
  });
});
