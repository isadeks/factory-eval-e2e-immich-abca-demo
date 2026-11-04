import { AlbumResponseDto, LoginResponseDto, SharedLinkType, createAlbum, getAllAlbums } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/albums hasPasswordProtectedSharedLink', () => {
  let admin: LoginResponseDto;
  let albumWithPassword: AlbumResponseDto;
  let albumWithoutPassword: AlbumResponseDto;
  let albumWithoutLink: AlbumResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    const headers = asBearerAuth(admin.accessToken);
    [albumWithPassword, albumWithoutPassword, albumWithoutLink] = await Promise.all([
      createAlbum({ createAlbumDto: { albumName: 'with password' } }, { headers }),
      createAlbum({ createAlbumDto: { albumName: 'without password' } }, { headers }),
      createAlbum({ createAlbumDto: { albumName: 'without link' } }, { headers }),
    ]);

    await Promise.all([
      utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: albumWithPassword.id,
        password: 'secret',
      }),
      utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: albumWithoutPassword.id,
      }),
    ]);
  });

  it('should flag only albums that have a password protected shared link', async () => {
    const albums = await getAllAlbums({}, { headers: asBearerAuth(admin.accessToken) });
    const byId = new Map(albums.map((album) => [album.id, album]));

    expect(byId.get(albumWithPassword.id)).toMatchObject({ hasSharedLink: true, hasPasswordProtectedSharedLink: true });
    expect(byId.get(albumWithoutPassword.id)).toMatchObject({
      hasSharedLink: true,
      hasPasswordProtectedSharedLink: false,
    });
    expect(byId.get(albumWithoutLink.id)).toMatchObject({ hasSharedLink: false, hasPasswordProtectedSharedLink: false });
  });
});
