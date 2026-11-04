import { AssetMediaResponseDto, LoginResponseDto, updateAsset } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Asset viewer favorite badge', () => {
  let admin: LoginResponseDto;
  let favorite: AssetMediaResponseDto;
  let regular: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    favorite = await utils.createAsset(admin.accessToken);
    regular = await utils.createAsset(admin.accessToken);
    await updateAsset(
      { id: favorite.id, updateAssetDto: { isFavorite: true } },
      { headers: { Authorization: `Bearer ${admin.accessToken}` } },
    );
  });

  test.beforeEach(async ({ context }) => {
    await utils.setAuthCookies(context, admin.accessToken);
  });

  test('shows the badge on a favorite asset', async ({ page }) => {
    await page.goto(`/photos/${favorite.id}`);
    await expect(page.getByTestId('asset-viewer-favorite-badge')).toBeVisible();
  });

  test('does not show the badge on a non-favorite asset', async ({ page }) => {
    await page.goto(`/photos/${regular.id}`);
    await expect(page.getByTestId('preview').filter({ visible: true })).toHaveAttribute('src', /.+/);
    await expect(page.getByTestId('asset-viewer-favorite-badge')).toHaveCount(0);
  });

  test('shows the favorite heart on the timeline thumbnail only for favorites', async ({ page }) => {
    await page.goto('/photos');
    await expect(page.locator(`[data-asset="${favorite.id}"] [data-icon-favorite]`)).toBeVisible();
    await expect(page.locator(`[data-asset="${regular.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-asset="${regular.id}"] [data-icon-favorite]`)).toHaveCount(0);
  });
});
