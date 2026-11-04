import { expect, test } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('asset viewer info panel shows the original file size', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const file = join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg');
  const bytes = statSync(file).size;
  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `file-size-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: { name: 'file-size.jpg', mimeType: 'image/jpeg', buffer: readFileSync(file) },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  // file size is stored by the metadata extraction job; wait for it
  await expect
    .poll(async () => (await (await request.get(`${API}/assets/${id}`, { headers })).json()).exifInfo?.fileSizeInByte, {
      timeout: 60_000,
    })
    .toBe(bytes);

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  const size = panel.getByTestId('detail-panel-file-size');
  await expect(size).toBeVisible();
  await expect(size).toHaveText(/^\d+(\.\d+)? (KiB|MiB)$/);

  await highlight(page, size, 'File size');
  await shot(page, 'Info panel shows the file size', { focus: size });
});
