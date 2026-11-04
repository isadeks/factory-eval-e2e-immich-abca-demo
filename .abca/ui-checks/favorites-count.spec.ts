import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('Favorites page header shows the number of favorites in a pill', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const ids: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const res = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `favorites-count-${Date.now()}-${i}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date(Date.UTC(2024, 0, i)).toISOString(),
        fileModifiedAt: new Date(Date.UTC(2024, 0, i)).toISOString(),
        isFavorite: 'true',
        assetData: {
          name: `photo-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${i}.jpg`)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    ids.push((await res.json()).id);
  }

  await signIn(page);
  await page.goto('/favorites');

  const pill = page.getByTestId('favorites-count');
  await expect(pill).toHaveText('3');
  await expect(page.locator('#user-page-header')).toHaveText('Favorites');

  await highlight(page, pill, 'New: favorite count');
  await shot(page, 'Favorites header shows a pill with the count', { focus: pill });
});
