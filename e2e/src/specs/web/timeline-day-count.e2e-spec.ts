import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Timeline day count', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('shows the number of photos next to each day header on the photos timeline', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await utils.createAsset(admin.accessToken, { fileCreatedAt: '2024-10-21T10:00:00.000Z' });
    await utils.createAsset(admin.accessToken, { fileCreatedAt: '2024-10-21T11:00:00.000Z' });
    await utils.createAsset(admin.accessToken, { fileCreatedAt: '2024-10-20T11:00:00.000Z' });

    await page.goto('/photos');

    const counts = page.getByTestId('timeline-day-count');
    await expect(counts).toHaveCount(2);
    await expect(counts.filter({ hasText: '· 2 photos' })).toHaveCount(1);
    await expect(counts.filter({ hasText: '· 1 photo' })).toHaveCount(1);
  });
});
