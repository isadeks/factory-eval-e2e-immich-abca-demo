import { AlbumUserRole } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { albumFactory } from '@test-data/factories/album-factory';
import { userAdminFactory, userFactory } from '@test-data/factories/user-factory';
import AlbumCard from '../AlbumCard.svelte';

describe('AlbumCard shared by', () => {
  const me = userAdminFactory.build();
  const owner = userFactory.build({ name: 'Alice Owner' });

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  beforeEach(() => {
    authManager.setUser(me);
  });

  it('shows who shared the album under the title', () => {
    const album = albumFactory.build({
      shared: true,
      albumUsers: [
        { user: owner, role: AlbumUserRole.Owner },
        { user: me, role: AlbumUserRole.Viewer },
      ],
    });
    const sut = render(AlbumCard, { album, showOwner: true, showItemCount: true });

    expect(sut.getByTestId('album-shared-by')).toHaveTextContent('Shared by Alice Owner');
    const title = sut.getByTestId('album-name');
    expect(title.nextElementSibling).toBe(sut.getByTestId('album-shared-by'));
  });

  it('shows "Shared by you" for albums owned by the current user', () => {
    const album = albumFactory.build({
      shared: true,
      albumUsers: [
        { user: me, role: AlbumUserRole.Owner },
        { user: owner, role: AlbumUserRole.Editor },
      ],
    });
    const sut = render(AlbumCard, { album, showOwner: true });

    expect(sut.getByTestId('album-shared-by')).toHaveTextContent('Shared by you');
  });

  it('does not show the shared-by line without showOwner', () => {
    const album = albumFactory.build({
      shared: true,
      albumUsers: [{ user: owner, role: AlbumUserRole.Owner }],
    });
    const sut = render(AlbumCard, { album });

    expect(sut.queryByTestId('album-shared-by')).not.toBeInTheDocument();
  });
});
