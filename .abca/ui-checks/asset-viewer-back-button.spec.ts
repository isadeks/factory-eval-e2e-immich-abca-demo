import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('asset viewer header shows a Back button that returns to the previous page', async ({ page, request }) => {
  const api = process.env.PREVIEW_API_URL!;
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `back-button-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  await signIn(page);
  await page.goto('/photos');
  await page.locator(`a[href*="${id}"], [data-asset-id="${id}"]`).first().click().catch(() => {});
  if (!page.url().includes(id)) {
    await page.goto(`/photos/${id}`);
  }

  const back = page.getByTestId('asset-viewer-back-button');
  await expect(back).toBeVisible();
  await expect(back).toHaveText('Back');
  await highlight(page, back, 'New: Back button');
  await shot(page, 'Asset viewer header shows a Back button', { focus: back });

  await back.click();
  await expect(back).toBeHidden();
  await shot(page, 'Back returns to the timeline');
});
