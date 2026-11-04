import { LoginResponseDto, getAssetStatistics } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('trashed asset count', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
  });

  it('should report the number of trashed assets, matching what emptying the trash removes', async () => {
    const [a, b] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
    await utils.createAsset(admin.accessToken); // not trashed
    await utils.deleteAssets(admin.accessToken, [a.id, b.id]);

    const stats = await getAssetStatistics({ isTrashed: true }, { headers: asBearerAuth(admin.accessToken) });
    expect(stats.total).toBe(2);
  });
});
