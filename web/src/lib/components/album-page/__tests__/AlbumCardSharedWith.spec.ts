import { AlbumUserRole } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import { userFactory } from '@test-data/factories/user-factory';
import AlbumCard from '../AlbumCard.svelte';

const buildAlbum = (viewers: number, shared = viewers > 0) =>
  albumFactory.build({
    albumThumbnailAssetId: null,
    shared,
    albumUsers: [
      { user: userFactory.build(), role: AlbumUserRole.Owner },
      ...Array.from({ length: viewers }, () => ({ user: userFactory.build(), role: AlbumUserRole.Viewer })),
    ],
  });

describe('AlbumCard shared-with count', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('does not show a count for an album that is not shared', () => {
    const sut = render(AlbumCard, { album: buildAlbum(0), showItemCount: true });
    expect(sut.queryByTestId('album-shared-with-count')).not.toBeInTheDocument();
  });

  it('does not show a count for an album shared only through a link', () => {
    const sut = render(AlbumCard, { album: buildAlbum(0, true), showItemCount: true });
    expect(sut.queryByTestId('album-shared-with-count')).not.toBeInTheDocument();
    expect(sut.getByTestId('album-details')).toHaveTextContent('Shared');
  });

  it('shows a singular count for one user, excluding the owner', () => {
    const sut = render(AlbumCard, { album: buildAlbum(1), showItemCount: true });
    expect(sut.getByTestId('album-shared-with-count')).toHaveTextContent('Shared with 1 person');
  });

  it('shows a plural count for several users', () => {
    const sut = render(AlbumCard, { album: buildAlbum(3), showItemCount: true });
    expect(sut.getByTestId('album-shared-with-count')).toHaveTextContent('Shared with 3 people');
  });
});
