import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('memory card on the photos page shows the memory year', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date();
  const year = now.getFullYear() - 3;
  const takenAt = new Date(now);
  takenAt.setFullYear(year);

  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
      deviceAssetId: `memory-card-year-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: takenAt.toISOString(),
      fileModifiedAt: takenAt.toISOString(),
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id: assetId } = await upload.json();

  const memory = await request.post(`${API}/memories`, {
    headers,
    data: { type: 'on_this_day', data: { year }, memoryAt: takenAt.toISOString(), assetIds: [assetId] },
  });
  expect(memory.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/photos');

  const card = page.locator('a[href*="/memory"]').filter({ hasText: String(year) }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText(`3 years ago (${year})`);

  await highlight(page, card, 'New: year in memory card');
  await shot(page, 'Memory card shows the memory year', { focus: card });
});
