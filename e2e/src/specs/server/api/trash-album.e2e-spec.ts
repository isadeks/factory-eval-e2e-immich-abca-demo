import { LoginResponseDto, getAllAlbums } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('trashed asset albums', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
  });

  it('should keep the original album of a trashed asset', async () => {
    const asset = await utils.createAsset(admin.accessToken);
    const album = await utils.createAlbum(admin.accessToken, { albumName: 'Original', assetIds: [asset.id] });
    await utils.deleteAssets(admin.accessToken, [asset.id]);

    const albums = await getAllAlbums({ assetId: asset.id }, { headers: asBearerAuth(admin.accessToken) });

    expect(albums).toEqual([expect.objectContaining({ id: album.id, albumName: 'Original' })]);
  });
});
