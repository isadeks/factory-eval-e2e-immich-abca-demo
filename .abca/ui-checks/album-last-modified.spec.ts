import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album page shows the last-modified date', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const file = join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg');
  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `last-modified-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(file),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const asset = await upload.json();

  const created = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: 'Last modified check', assetIds: [asset.id] },
  });
  expect(created.ok()).toBeTruthy();
  const album = await created.json();
  const expected = new Date(album.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  const lastModified = page.getByTestId('album-last-modified');
  await expect(lastModified).toBeVisible();
  await expect(lastModified).toContainText('Last modified');
  await expect(lastModified.locator('time')).toHaveAttribute(
    'datetime',
    album.updatedAt,
  );
  await expect(lastModified).toContainText(expected);

  await highlight(page, lastModified, 'New: last-modified date');
  await shot(page, 'Album page shows the last-modified date', {
    focus: page.getByTestId('album-details'),
  });
});
