import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('account page shows storage used in human-readable form', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken, userId } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 10 GiB quota
  const update = await request.put(`${api}/admin/users/${userId}`, {
    headers,
    data: { quotaSizeInBytes: 10 * 1024 ** 3 },
  });
  expect(update.ok()).toBeTruthy();

  // upload a sample photo so that usage is non-zero
  const file = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `storage-usage-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: { name: 'photo-1.jpg', mimeType: 'image/jpeg', buffer: file },
    },
  });
  expect(upload.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/user-settings');
  await page.getByRole('button', { name: 'Account Manage your account' }).click();

  const field = page.getByTestId('storage-used');
  await expect(field).toBeVisible();
  await expect(field).toHaveValue(/^[\d.,]+ (KiB|MiB) of 10 GiB$/);

  await highlight(page, field, 'New: Storage used');
  await shot(page, 'Account settings show storage used out of the quota', { focus: field });
});
