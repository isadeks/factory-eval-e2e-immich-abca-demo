import type { AlbumResponseDto } from '@immich/sdk';
import { AlbumSortBy, SortOrder } from '$lib/stores/preferences.store';
import { findSortToggleOption, getSortToggleSettings, sortAlbums, sortToggleOptions } from '$lib/utils/album-utils';

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

describe('album sort toggle', () => {
  it('offers name and date created', () => {
    expect([...sortToggleOptions]).toEqual([AlbumSortBy.Title, AlbumSortBy.DateCreated]);
  });

  it('finds the toggle option for the current sort', () => {
    expect(findSortToggleOption(AlbumSortBy.Title)).toBe(AlbumSortBy.Title);
    expect(findSortToggleOption(AlbumSortBy.DateCreated)).toBe(AlbumSortBy.DateCreated);
  });

  it('has no selected option for other sorts', () => {
    expect(findSortToggleOption(AlbumSortBy.ItemCount)).toBeUndefined();
    expect(findSortToggleOption('unknown')).toBeUndefined();
  });

  it('uses ascending order for name and descending order for date created', () => {
    expect(getSortToggleSettings(AlbumSortBy.Title)).toEqual({ sortBy: AlbumSortBy.Title, sortOrder: SortOrder.Asc });
    expect(getSortToggleSettings(AlbumSortBy.DateCreated)).toEqual({
      sortBy: AlbumSortBy.DateCreated,
      sortOrder: SortOrder.Desc,
    });
  });
});
