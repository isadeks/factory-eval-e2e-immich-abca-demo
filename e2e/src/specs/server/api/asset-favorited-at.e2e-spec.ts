import { AssetMediaResponseDto, getAssetInfo, LoginResponseDto, updateAsset, updateAssets } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/asset favoritedAt', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
  });

  it('should not have a favoritedAt date before the asset is favorited', async () => {
    const info = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

    expect(info.isFavorite).toBe(false);
    expect(info.favoritedAt ?? null).toBeNull();
  });

  it('should set favoritedAt when the asset is favorited', async () => {
    const before = Date.now();
    await updateAsset(
      { id: asset.id, updateAssetDto: { isFavorite: true } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    const info = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

    expect(info.isFavorite).toBe(true);
    expect(info.favoritedAt).toEqual(expect.any(String));
    expect(new Date(info.favoritedAt!).getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(new Date(info.favoritedAt!).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('should clear favoritedAt when the asset is unfavorited', async () => {
    await updateAssets(
      { assetBulkUpdateDto: { ids: [asset.id], isFavorite: false } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    const info = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

    expect(info.isFavorite).toBe(false);
    expect(info.favoritedAt ?? null).toBeNull();
  });

  it('should set favoritedAt when favoriting through the bulk update', async () => {
    await updateAssets(
      { assetBulkUpdateDto: { ids: [asset.id], isFavorite: true } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    const info = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

    expect(info.isFavorite).toBe(true);
    expect(info.favoritedAt).toEqual(expect.any(String));
  });
});
