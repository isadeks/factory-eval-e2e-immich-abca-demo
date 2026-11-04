import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('asset viewer shows a heart badge only for favorited assets', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = async (file: string, id: string) => {
    const res = await request.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: id,
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: { name: file, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)) },
      },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id as string;
  };

  const favoriteId = await upload('photo-1.jpg', `fav-${Date.now()}`);
  const regularId = await upload('photo-2.jpg', `reg-${Date.now()}`);
  const upd = await request.put(`${API}/assets/${favoriteId}`, { headers, data: { isFavorite: true } });
  expect(upd.ok()).toBeTruthy();

  await signIn(page);
  const badge = page.getByTestId('asset-viewer-favorite-badge');

  await page.goto(`/photos/${regularId}`);
  await expect(page.getByTestId('asset-viewer-navbar-actions')).toBeVisible();
  await expect(badge).toHaveCount(0);
  await shot(page, 'A non-favorite asset shows no badge');

  await page.goto(`/photos/${favoriteId}`);
  await expect(badge).toBeVisible();
  const box = await badge.boundingBox();
  expect(box!.x).toBeLessThan(100);
  expect(box!.y).toBeLessThan(120);
  await highlight(page, badge, 'New: Favorite badge');
  await shot(page, 'A favorited asset shows a heart badge top-left', { focus: badge });
});
