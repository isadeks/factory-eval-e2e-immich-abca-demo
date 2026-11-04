import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('copy button on a shared link shows "Copied" for 2 seconds', async ({ page }) => {
  // log in through the API and create an individual shared link with one uploaded asset
  const login = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  expect(login.ok).toBeTruthy();
  const { accessToken } = await login.json();
  const auth = { Authorization: `Bearer ${accessToken}` };

  const dir = process.env.UI_CHECK_ASSETS!;
  const file = readdirSync(dir).find((f) => f === 'photo-1.jpg')!;
  const form = new FormData();
  const now = new Date().toISOString();
  form.append('deviceAssetId', `copy-feedback-${Date.now()}`);
  form.append('deviceId', 'ui-check');
  form.append('fileCreatedAt', now);
  form.append('fileModifiedAt', now);
  form.append('assetData', new Blob([readFileSync(join(dir, file))], { type: 'image/jpeg' }), file);
  const upload = await fetch(`${apiUrl}/assets`, { method: 'POST', headers: auth, body: form });
  expect(upload.ok).toBeTruthy();
  const asset = await upload.json();

  const created = await fetch(`${apiUrl}/shared-links`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'INDIVIDUAL', assetIds: [asset.id], description: 'copy feedback' }),
  });
  expect(created.ok).toBeTruthy();

  // the clipboard API is unavailable on insecure origins, so stub it
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true });
  });

  await signIn(page);
  await page.goto('/shared-links');

  const copy = page.getByRole('button', { name: 'Copy link', exact: true }).first();
  await expect(copy).toBeVisible();
  await highlight(page, copy, 'Copy link');
  await shot(page, 'Shared link with the Copy link button', { focus: copy });

  await copy.click();
  const copied = page.getByRole('button', { name: 'Copied', exact: true }).first();
  await expect(copied).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0);
  await highlight(page, copied, 'Copied');
  await shot(page, 'Button reads Copied right after clicking', { focus: copied });

  // reverts after ~2 seconds
  await expect(page.getByRole('button', { name: 'Copy link', exact: true }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toHaveCount(0);
  await shot(page, 'Button is back to Copy link', { focus: page.getByRole('button', { name: 'Copy link', exact: true }).first() });
});
