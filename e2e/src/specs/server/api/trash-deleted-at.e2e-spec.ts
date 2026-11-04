import { LoginResponseDto, getAssetInfo } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('asset deletedAt', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
  });

  it('should not return deletedAt for assets that are not trashed', async () => {
    const { id } = await utils.createAsset(admin.accessToken);

    const asset = await getAssetInfo({ id }, { headers: asBearerAuth(admin.accessToken) });

    expect(asset.isTrashed).toBe(false);
    expect(asset.deletedAt).toBeUndefined();
  });

  it('should return when the asset was trashed', async () => {
    const { id } = await utils.createAsset(admin.accessToken);
    const before = Date.now();
    await utils.deleteAssets(admin.accessToken, [id]);

    const asset = await getAssetInfo({ id }, { headers: asBearerAuth(admin.accessToken) });

    expect(asset.isTrashed).toBe(true);
    expect(asset.deletedAt).toBeDefined();
    const deletedAt = new Date(asset.deletedAt!).getTime();
    expect(deletedAt).toBeGreaterThanOrEqual(before - 60_000);
    expect(deletedAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });
});
