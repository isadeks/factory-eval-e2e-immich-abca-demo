import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('duplicates page shows the number of duplicates', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const ids: string[] = [];
  for (const name of ['photo-1.jpg', 'photo-2.jpg']) {
    const upload = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: randomUUID(),
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
    ids.push((await upload.json()).id);
  }

  const update = await request.put(`${apiUrl}/assets`, { headers, data: { ids, duplicateId: randomUUID() } });
  expect(update.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/utilities/duplicates');

  const count = page.getByTestId('duplicates-count');
  await expect(count).toBeVisible();
  await expect(count).toHaveText('1 duplicate');
  await highlight(page, count, 'New: duplicate count');
  await shot(page, 'Duplicates page shows the number of duplicates', { focus: count });
});
