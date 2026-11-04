import { AlbumSortBy, SortOrder } from '$lib/stores/preferences.store';
import { sortAlbums } from '$lib/utils/album-utils';
import { albumFactory } from '@test-data/factories/album-factory';

describe('sortAlbums by asset count', () => {
  const small = albumFactory.build({ albumName: 'Small', assetCount: 1 });
  const medium = albumFactory.build({ albumName: 'Medium', assetCount: 5 });
  const large = albumFactory.build({ albumName: 'Large', assetCount: 20 });
  const empty = albumFactory.build({ albumName: 'Empty', assetCount: 0 });

  it('sorts descending, largest album first', () => {
    const sorted = sortAlbums([small, empty, large, medium], {
      sortBy: AlbumSortBy.ItemCount,
      orderBy: SortOrder.Desc,
    });
    expect(sorted.map(({ albumName }) => albumName)).toEqual(['Large', 'Medium', 'Small', 'Empty']);
  });

  it('sorts ascending, smallest album first', () => {
    const sorted = sortAlbums([small, empty, large, medium], { sortBy: AlbumSortBy.ItemCount, orderBy: SortOrder.Asc });
    expect(sorted.map(({ albumName }) => albumName)).toEqual(['Empty', 'Small', 'Medium', 'Large']);
  });

  it('orders albums with equal counts by title in both directions', () => {
    const b = albumFactory.build({ albumName: 'b', assetCount: 3 });
    const a = albumFactory.build({ albumName: 'A', assetCount: 3 });
    const c = albumFactory.build({ albumName: 'C', assetCount: 3 });

    for (const orderBy of [SortOrder.Asc, SortOrder.Desc]) {
      const sorted = sortAlbums([c, b, a], { sortBy: AlbumSortBy.ItemCount, orderBy });
      expect(sorted.map(({ albumName }) => albumName)).toEqual(['A', 'b', 'C']);
    }
  });

  it('does not mutate the input array', () => {
    const input = [small, large, medium];
    sortAlbums(input, { sortBy: AlbumSortBy.ItemCount, orderBy: SortOrder.Desc });
    expect(input).toEqual([small, large, medium]);
  });
});
