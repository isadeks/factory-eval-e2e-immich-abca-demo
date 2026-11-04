import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('video tiles in the asset grid show an m:ss duration badge', async ({ page, request }) => {
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
      deviceAssetId: `video-duration-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: { name: 'sample-5s.mp4', mimeType: 'video/mp4', buffer: readFileSync(join(__dirname, 'sample-5s.mp4')) },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  // wait for metadata extraction to record the duration (milliseconds)
  await expect
    .poll(
      async () => {
        const response = await request.get(`${API}/assets/${id}`, { headers });
        return (await response.json()).duration ?? 0;
      },
      { timeout: 60_000 },
    )
    .toBeGreaterThan(0);

  await signIn(page);
  await page.goto('/photos');

  const badge = page.getByTestId('video-duration-badge').first();
  await expect(badge).toBeVisible({ timeout: 30_000 });
  await expect(badge).toHaveText(/^[0-5]:\d{2}$/);
  await expect(badge).toHaveText('0:05');

  await highlight(page, badge, 'New: duration badge');
  await shot(page, 'Video tile shows its duration (m:ss) in a small badge', { focus: badge });
});
