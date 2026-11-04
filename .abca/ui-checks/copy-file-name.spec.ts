import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('asset menu has a Copy file name item that copies the file name', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const login = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  const { accessToken } = await login.json();

  const form = new FormData();
  const now = new Date().toISOString();
  form.append('deviceAssetId', `copy-file-name-${Date.now()}`);
  form.append('deviceId', 'ui-check');
  form.append('fileCreatedAt', now);
  form.append('fileModifiedAt', now);
  form.append(
    'assetData',
    new Blob([readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'))], { type: 'image/jpeg' }),
    'my-holiday-photo.jpg',
  );
  const upload = await fetch(`${apiUrl}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  expect(upload.ok).toBe(true);
  const { id } = await upload.json();

  await signIn(page);
  await page.goto(`/photos/${id}`);

  await page.getByRole('button', { name: 'More' }).click();
  const item = page.getByRole('menuitem', { name: 'Copy file name' });
  await expect(item).toBeVisible();
  await highlight(page, item, 'New: Copy file name');
  await shot(page, 'Asset menu shows Copy file name', { focus: item });

  await item.click();
  await expect(page.getByText('Copied to clipboard!')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('my-holiday-photo.jpg');
  await shot(page, 'File name copied to the clipboard');
});
