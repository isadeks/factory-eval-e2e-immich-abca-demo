import { render } from '@testing-library/svelte';
import AlbumListItem from '$lib/components/asset-viewer/AlbumListItem.svelte';
import { albumFactory } from '@test-data/factories/album-factory';

describe('AlbumListItem component', () => {
  const props = { selected: false, onAlbumClick: vi.fn(), onMultiSelect: vi.fn() };

  it('shows a placeholder cover when the album is empty', () => {
    const { getByTestId } = render(AlbumListItem, {
      ...props,
      album: albumFactory.build({ albumName: 'Empty', albumThumbnailAssetId: null, assetCount: 0 }),
    });

    const img = getByTestId('album-image') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.alt).toBe('Empty');
    expect(img.getAttribute('src')).toStrictEqual(expect.any(String));
    expect(img.getAttribute('src')).not.toContain('/api/assets/');
  });

  it('shows the album thumbnail when the album has a cover', () => {
    const { getByTestId } = render(AlbumListItem, {
      ...props,
      album: albumFactory.build({ albumName: 'Full', albumThumbnailAssetId: 'asset-1', assetCount: 3 }),
    });

    const img = getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('Full');
    expect(img.getAttribute('src')).toContain('asset-1');
  });
});
