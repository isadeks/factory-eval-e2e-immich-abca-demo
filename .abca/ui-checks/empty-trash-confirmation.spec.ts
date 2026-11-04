import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('Empty trash confirmation says how many items will be deleted', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const ids: string[] = [];
  for (const name of ['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg']) {
    const now = new Date().toISOString();
    const upload = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `${name}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: { name, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)) },
      },
    });
    expect(upload.ok()).toBeTruthy();
    ids.push((await upload.json()).id);
  }

  const trashed = await request.delete(`${apiUrl}/assets`, { headers, data: { ids } });
  expect(trashed.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/trash');

  const emptyButton = page.getByRole('button', { name: 'Empty trash' });
  await expect(emptyButton).toBeVisible();
  await highlight(page, emptyButton, 'Empty trash');
  await shot(page, 'Trash page with three trashed photos', { focus: emptyButton });

  await emptyButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('3 assets');
  await highlight(page, dialog, 'New: confirmation shows the count');
  await shot(page, 'Confirmation says 3 assets will be removed', { focus: dialog });

  // cancelling keeps the items in the trash
  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).toBeHidden();
  const stats = await request.get(`${apiUrl}/assets/statistics?isTrashed=true`, { headers });
  expect((await stats.json()).total).toBe(3);
});
