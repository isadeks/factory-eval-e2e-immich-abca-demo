import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('trashed asset tiles show how many days are left until permanent deletion', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const configResponse = await request.get(`${apiUrl}/server/config`, { headers });
  const { trashDays } = await configResponse.json();

  const now = new Date().toISOString();
  const upload = await request.post(`${apiUrl}/assets`, {
    headers,
    multipart: {
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
      deviceAssetId: `trash-badge-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  const trash = await request.delete(`${apiUrl}/assets`, { headers, data: { ids: [id] } });
  expect(trash.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/trash');

  const tile = page.locator(`[data-asset="${id}"]`);
  await expect(tile).toBeVisible();

  const badge = tile.getByTestId('trash-retention-badge');
  await expect(badge).toHaveText(`Deletes in ${trashDays} ${trashDays === 1 ? 'day' : 'days'}`);

  await highlight(page, badge, 'New: Deletes in N days badge');
  await shot(page, 'Trashed tile shows the days left until permanent deletion', { focus: tile });
});
