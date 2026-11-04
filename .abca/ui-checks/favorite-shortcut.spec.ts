import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('pressing "f" in the asset viewer toggles the favorite state', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `favorite-shortcut-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  const isFavorite = async () => {
    const response = await request.get(`${API}/assets/${id}`, { headers });
    return (await response.json()).isFavorite as boolean;
  };

  await signIn(page);
  await page.goto(`/photos/${id}`);

  const favoriteButton = page.getByRole('button', { name: 'Favorite', exact: true });
  const unfavoriteButton = page.getByRole('button', { name: 'Unfavorite', exact: true });

  await expect(favoriteButton).toBeVisible();
  await highlight(page, favoriteButton, 'Not a favorite yet');
  await shot(page, 'Viewer before pressing f', { focus: favoriteButton });

  // make sure focus is on the page, not in an input
  await page.locator('#immich-asset-viewer').click({ position: { x: 300, y: 300 } }).catch(() => {});
  await page.keyboard.press('f');

  await expect(unfavoriteButton).toBeVisible();
  await expect.poll(isFavorite).toBe(true);
  await highlight(page, unfavoriteButton, 'f marked it as favorite');
  await shot(page, 'After pressing f the asset is a favorite', { focus: unfavoriteButton });

  await page.keyboard.press('f');

  await expect(favoriteButton).toBeVisible();
  await expect.poll(isFavorite).toBe(false);
  await highlight(page, favoriteButton, 'f again removed the favorite');
  await shot(page, 'Pressing f again removes the favorite', { focus: favoriteButton });
});
