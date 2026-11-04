import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { albumFactory } from '@test-data/factories/album-factory';
import DetailPanelAlbums from './DetailPanelAlbums.svelte';

describe('DetailPanelAlbums', () => {
  it('labels albums of a regular asset as "Appears in"', () => {
    const album = albumFactory.build({ albumName: 'Holiday' });
    render(DetailPanelAlbums, { props: { albums: [album] } });

    expect(screen.getByText('appears_in')).toBeInTheDocument();
    expect(screen.queryByText('original_albums')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', `/albums/${album.id}`);
  });

  it('shows the original album of a trashed asset', () => {
    const album = albumFactory.build({ albumName: 'Holiday' });
    render(DetailPanelAlbums, { props: { albums: [album], isTrashed: true } });

    expect(screen.getByText('original_albums')).toBeInTheDocument();
    expect(screen.queryByText('appears_in')).not.toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', `/albums/${album.id}`);
  });

  it('renders nothing when the asset is in no album', () => {
    render(DetailPanelAlbums, { props: { albums: [], isTrashed: true } });

    expect(screen.queryByTestId('detail-panel-albums')).not.toBeInTheDocument();
  });
});
