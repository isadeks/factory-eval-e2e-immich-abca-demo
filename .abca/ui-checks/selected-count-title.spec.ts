import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('page title shows the number of selected assets', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  for (const [i, name] of ['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg'].entries()) {
    const res = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `selected-title-${Date.now()}-${i}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date(2024, 0, 1 + i).toISOString(),
        fileModifiedAt: new Date(2024, 0, 1 + i).toISOString(),
        assetData: {
          name,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const thumbnails = page.locator('[data-thumbnail-focus-container]');
  await expect(thumbnails).toHaveCount(3, { timeout: 60_000 });
  await expect(page).toHaveTitle(/^Photos - Immich$/);
  await shot(page, 'No selection: plain page title');

  await thumbnails.nth(0).focus();
  await page.keyboard.press('x');
  await expect(page).toHaveTitle('(1 selected) Photos - Immich');

  await thumbnails.nth(1).focus();
  await page.keyboard.press('x');
  await expect(page).toHaveTitle('(2 selected) Photos - Immich');

  const bar = page.getByText('2 selected').first();
  await highlight(page, bar, 'Selection count (also in tab title)');
  await shot(page, 'Two assets selected: title reads "(2 selected) Photos - Immich"', { focus: bar });

  await page.keyboard.press('Escape');
  await expect(page).toHaveTitle('Photos - Immich');
  await shot(page, 'Selection cleared: title back to normal');
});
