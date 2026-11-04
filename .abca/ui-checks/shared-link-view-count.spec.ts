import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('shared links list shows how often a link was viewed', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `view-count-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: new Date(2024, 0, 1).toISOString(),
      fileModifiedAt: new Date(2024, 0, 1).toISOString(),
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id: assetId } = await upload.json();

  const created = await request.post(`${api}/shared-links`, {
    headers,
    data: { type: 'INDIVIDUAL', assetIds: [assetId], description: 'view count check' },
  });
  expect(created.ok()).toBeTruthy();
  const { key } = await created.json();

  await signIn(page);
  await page.goto('/shared-links');

  const views = page.getByTestId('shared-link-view-count');
  await expect(views).toHaveText('0 views', { timeout: 30_000 });
  await highlight(page, views, 'New: view count');
  await shot(page, 'A link nobody opened yet shows 0 views', { focus: views });

  // visitors open the link (anonymous, using only the key)
  for (let i = 0; i < 3; i++) {
    const visit = await request.get(`${api}/shared-links/me`, { params: { key } });
    expect(visit.ok()).toBeTruthy();
  }

  await page.reload();
  await expect(views).toHaveText('3 views', { timeout: 30_000 });
  await highlight(page, views, 'New: view count');
  await shot(page, 'After three visits the card shows 3 views', { focus: views });
});
