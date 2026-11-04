import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const DESCRIPTION = 'A golden retriever running along the beach at sunset';

test('thumbnails use the asset description as alt text', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `desc-alt-${Date.now()}`,
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

  const update = await request.put(`${API}/assets/${id}`, { headers, data: { description: DESCRIPTION } });
  expect(update.ok()).toBeTruthy();

  await signIn(page);
  await page.goto(`/search?query=${encodeURIComponent(JSON.stringify({ description: DESCRIPTION }))}`);

  const thumbnail = page.locator(`[data-thumbnail-focus-container] img[alt="${DESCRIPTION}"]`);
  await expect(thumbnail).toHaveCount(1, { timeout: 60_000 });
  await expect(thumbnail).toHaveAttribute('alt', DESCRIPTION);

  await highlight(page, thumbnail, 'New: alt text = description');
  await shot(page, 'Search result thumbnail carries the description as alt text', { focus: thumbnail });
});
