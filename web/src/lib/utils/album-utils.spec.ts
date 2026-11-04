import type { AlbumResponseDto } from '@immich/sdk';
import { AlbumSortBy, SortOrder } from '$lib/stores/preferences.store';
import { sortAlbums } from '$lib/utils/album-utils';

const album = (albumName: string, createdAt: string) => ({ albumName, createdAt }) as AlbumResponseDto;

describe('sortAlbums name / date created toggle', () => {
  const albums = [
    album('Banana', '2023-01-01T00:00:00.000Z'),
    album('cherry', '2021-01-01T00:00:00.000Z'),
    album('Apple', '2022-01-01T00:00:00.000Z'),
  ];

  it('sorts by name ascending', () => {
    const result = sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: SortOrder.Asc });
    expect(result.map(({ albumName }) => albumName)).toEqual(['Apple', 'Banana', 'cherry']);
  });

  it('sorts by name descending', () => {
    const result = sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: SortOrder.Desc });
    expect(result.map(({ albumName }) => albumName)).toEqual(['cherry', 'Banana', 'Apple']);
  });

  it('sorts by date created, newest first', () => {
    const result = sortAlbums(albums, { sortBy: AlbumSortBy.DateCreated, orderBy: SortOrder.Desc });
    expect(result.map(({ albumName }) => albumName)).toEqual(['Banana', 'Apple', 'cherry']);
  });

  it('sorts by date created, oldest first', () => {
    const result = sortAlbums(albums, { sortBy: AlbumSortBy.DateCreated, orderBy: SortOrder.Asc });
    expect(result.map(({ albumName }) => albumName)).toEqual(['cherry', 'Apple', 'Banana']);
  });

  it('does not mutate the input', () => {
    const copy = [...albums];
    sortAlbums(albums, { sortBy: AlbumSortBy.Title, orderBy: SortOrder.Asc });
    expect(albums).toEqual(copy);
  });
});
