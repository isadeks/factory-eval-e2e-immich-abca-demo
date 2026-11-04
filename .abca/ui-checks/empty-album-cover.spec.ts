import { expect, request, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('empty albums show a placeholder cover in the add-to-album picker', async ({ page }) => {
  const api = await request.newContext();
  const login = await api.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await api.post(`${apiUrl}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `empty-album-cover-${Date.now()}`,
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
  const asset = await upload.json();

  const albumName = `Empty album ${Date.now()}`;
  const created = await api.post(`${apiUrl}/albums`, { headers, data: { albumName } });
  expect(created.ok()).toBeTruthy();

  await signIn(page);
  await page.goto(`/photos/${asset.id}`);
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'Add to album' }).click();

  const dialog = page.getByRole('dialog');
  const row = dialog.getByRole('button').filter({ hasText: albumName }).first();
  await expect(row).toBeVisible();

  const cover = row.getByTestId('album-image');
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute('src', /.+/);
  await expect(cover).not.toHaveAttribute('src', /\/api\/assets\//);
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await highlight(page, cover, 'New: placeholder cover');
  await shot(page, 'Empty album shows a placeholder cover in the picker', { focus: row });
});
