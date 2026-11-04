import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('admin users list shows storage used per user', async ({ page }) => {
  const login = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  const { accessToken: adminToken } = await login.json();

  const email = `storage-${Date.now()}@example.com`;
  const password = 'password';
  const created = await fetch(`${api}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ email, password, name: 'Storage User', quotaSizeInBytes: 1024 ** 3 }),
  });
  expect(created.ok).toBe(true);

  const userLogin = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { accessToken: userToken } = await userLogin.json();

  const bytes = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  const form = new FormData();
  form.append('deviceAssetId', `storage-${Date.now()}`);
  form.append('deviceId', 'ui-check');
  form.append('fileCreatedAt', new Date().toISOString());
  form.append('fileModifiedAt', new Date().toISOString());
  form.append('assetData', new Blob([bytes], { type: 'image/jpeg' }), 'photo-1.jpg');
  const upload = await fetch(`${api}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: form,
  });
  expect(upload.ok).toBe(true);

  await signIn(page);
  await page.goto('/admin/users');

  const row = page.getByRole('row', { name: /Storage User/ });
  const usage = row.getByTestId('user-storage-usage');
  await expect(usage).toContainText('of 1 GiB used');
  await expect(usage).not.toContainText(/^0 B of/);

  await highlight(page, usage, 'New: storage per user');
  await shot(page, 'Admin users list shows storage used per user', { focus: row });
});
