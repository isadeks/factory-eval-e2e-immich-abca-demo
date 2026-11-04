import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

test('hovering a thumbnail shows its capture date in the tooltip', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
      deviceAssetId: `capture-date-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: '2023-06-15T10:20:00.000Z',
      fileModifiedAt: '2023-06-15T10:20:00.000Z',
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  await signIn(page);

  // metadata extraction (EXIF) may still change the date: compare with the API's current value and reload until they agree
  const thumbnail = page.locator(`[data-asset="${id}"]`);
  let expected = '';
  await expect(async () => {
    const res = await request.get(`${API}/assets/${id}`, { headers });
    const date = new Date((await res.json()).localDateTime);
    expected = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    await page.goto('/photos');
    await expect(thumbnail).toBeVisible({ timeout: 5000 });
    await thumbnail.hover();
    await expect(thumbnail).toHaveAttribute('title', new RegExp(expected), { timeout: 2000 });
  }).toPass({ timeout: 60_000 });

  await highlight(page, thumbnail, 'New: tooltip shows capture date');
  await shot(page, `Hovered thumbnail has tooltip "${expected}..."`, { focus: thumbnail });
});
