import { AlbumUserRole, getAlbumInfo, LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/albums/:id/users (sharing roles)', () => {
  let admin: LoginResponseDto;
  let owner: LoginResponseDto;
  let editor: LoginResponseDto;
  let viewer: LoginResponseDto;
  let defaultRoleUser: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [owner, editor, viewer, defaultRoleUser] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
      utils.userSetup(admin.accessToken, createUserDto.user4),
    ]);
  });

  it('should share an album with several users using the chosen roles', async () => {
    const album = await utils.createAlbum(owner.accessToken, { albumName: 'role sharing' });

    const { status, body } = await request(app)
      .put(`/albums/${album.id}/users`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        albumUsers: [
          { userId: editor.userId, role: AlbumUserRole.Editor },
          { userId: viewer.userId, role: AlbumUserRole.Viewer },
          { userId: defaultRoleUser.userId },
        ],
      });

    expect(status).toBe(200);
    expect(body.albumUsers).toEqual(
      expect.arrayContaining([
        { role: AlbumUserRole.Owner, user: expect.objectContaining({ id: owner.userId }) },
        { role: AlbumUserRole.Editor, user: expect.objectContaining({ id: editor.userId }) },
        { role: AlbumUserRole.Viewer, user: expect.objectContaining({ id: viewer.userId }) },
        { role: AlbumUserRole.Editor, user: expect.objectContaining({ id: defaultRoleUser.userId }) },
      ]),
    );

    const info = await getAlbumInfo({ id: album.id }, { headers: asBearerAuth(viewer.accessToken) });
    expect(info.shared).toBe(true);
  });

  it('should not let a viewer add assets to the album', async () => {
    const album = await utils.createAlbum(owner.accessToken, {
      albumName: 'viewer cannot add',
      albumUsers: [
        { userId: viewer.userId, role: AlbumUserRole.Viewer },
        { userId: editor.userId, role: AlbumUserRole.Editor },
      ],
    });
    const asset = await utils.createAsset(viewer.accessToken);

    const viewerResponse = await request(app)
      .put(`/albums/${album.id}/assets`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ ids: [asset.id] });
    expect(viewerResponse.status).toBe(400);

    const editorAsset = await utils.createAsset(editor.accessToken);
    const editorResponse = await request(app)
      .put(`/albums/${album.id}/assets`)
      .set('Authorization', `Bearer ${editor.accessToken}`)
      .send({ ids: [editorAsset.id] });
    expect(editorResponse.status).toBe(200);
  });
});
