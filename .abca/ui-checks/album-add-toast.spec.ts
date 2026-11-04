import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('shows a toast after adding an asset to an album', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `toast-${Date.now()}`,
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

  const albumName = `Toast album ${Date.now()}`;
  const albumRes = await request.post(`${api}/albums`, { headers, data: { albumName } });
  expect(albumRes.ok()).toBeTruthy();

  await signIn(page);
  await page.goto(`/photos/${asset.id}`);

  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Add to album' }).click();

  const albumRow = page.getByRole('dialog').getByText(albumName, { exact: true }).first();
  await expect(albumRow).toBeVisible();
  await shot(page, 'Album picker lists the album');
  await albumRow.click();

  const toast = page.getByText('Added 1 asset to the album');
  await expect(toast).toBeVisible();
  const viewAlbum = page.getByRole('button', { name: 'View Album' });
  await expect(viewAlbum).toBeVisible();
  await highlight(page, toast, 'New: toast after adding to album');
  await shot(page, 'Toast confirms the asset was added to the album', { focus: toast });
});
