import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanelLibrary from './DetailPanelLibrary.svelte';

describe('DetailPanelLibrary', () => {
  it('shows the library path for an external library asset owned by the user', () => {
    const asset = assetFactory.build({ libraryId: 'library-1', originalPath: '/mnt/photos/trip/photo.jpg' });

    render(DetailPanelLibrary, { props: { asset, isOwner: true } });

    expect(screen.getByTestId('detail-panel-library')).toBeInTheDocument();
    expect(screen.getByText('library')).toBeInTheDocument();
    expect(screen.getByTestId('detail-panel-library-path')).toHaveTextContent('/mnt/photos/trip/photo.jpg');
  });

  it('shows nothing for an asset that is not in a library', () => {
    const asset = assetFactory.build({ libraryId: null, originalPath: '/data/upload/photo.jpg' });

    render(DetailPanelLibrary, { props: { asset, isOwner: true } });

    expect(screen.queryByTestId('detail-panel-library')).not.toBeInTheDocument();
  });

  it('shows nothing when the viewer is not the owner', () => {
    const asset = assetFactory.build({ libraryId: 'library-1', originalPath: '/mnt/photos/photo.jpg' });

    render(DetailPanelLibrary, { props: { asset, isOwner: false } });

    expect(screen.queryByTestId('detail-panel-library')).not.toBeInTheDocument();
  });
});
