import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

const upload = async (token: string, file: string, name: string) => {
  const now = new Date().toISOString();
  const res = await fetch(`${API}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: (() => {
      const form = new FormData();
      form.append('deviceAssetId', `${name}-${Date.now()}`);
      form.append('deviceId', 'ui-check');
      form.append('fileCreatedAt', now);
      form.append('fileModifiedAt', now);
      form.append(
        'assetData',
        new Blob([readFileSync(join(process.env.UI_CHECK_ASSETS!, file))], { type: 'image/jpeg' }),
        name,
      );
      return form;
    })(),
  });
  expect(res.ok).toBeTruthy();
  return (await res.json()).id as string;
};

test('archived assets are dimmed in search results', async ({ page }) => {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  const { accessToken } = await login.json();

  const archivedId = await upload(accessToken, 'photo-1.jpg', 'dimcheck-archived.jpg');
  const timelineId = await upload(accessToken, 'photo-2.jpg', 'dimcheck-timeline.jpg');
  const res = await fetch(`${API}/assets`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [archivedId], visibility: 'archive' }),
  });
  expect(res.ok).toBeTruthy();

  await signIn(page);

  const search = (visibility: string) =>
    `/search?query=${encodeURIComponent(JSON.stringify({ originalFileName: 'dimcheck', visibility }))}`;

  await page.goto(search('archive'));
  const archived = page.locator(`[data-asset="${archivedId}"]`);
  await expect(archived).toBeVisible({ timeout: 60_000 });
  const dim = archived.getByTestId('archived-dim');
  await expect(dim).toBeVisible();
  await highlight(page, archived, 'New: archived result is dimmed');
  await shot(page, 'Archived asset is dimmed in search results', { focus: archived });

  await page.goto(search('timeline'));
  const normal = page.locator(`[data-asset="${timelineId}"]`);
  await expect(normal).toBeVisible({ timeout: 60_000 });
  await expect(normal.getByTestId('archived-dim')).toHaveCount(0);
  await highlight(page, normal, 'Timeline result is not dimmed');
  await shot(page, 'Non-archived asset is not dimmed', { focus: normal });
});
