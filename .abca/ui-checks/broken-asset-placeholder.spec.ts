import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

// The app's service worker serves image requests itself, which page.route cannot intercept.
test.use({ serviceWorkers: 'block' });

test('explore shows a placeholder for a recently added asset whose thumbnail fails to load', async ({ page, request }) => {
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
      deviceAssetId: `broken-placeholder-${Date.now()}`,
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

  // Make every thumbnail request for the asset fail.
  await page.route(new RegExp(`/api/assets/${id}/thumbnail`), (route) => route.abort());

  await signIn(page);
  await page.goto('/explore');

  const placeholder = page.locator('[data-broken-asset]').first();
  await expect(placeholder).toBeVisible();
  await expect(placeholder).toContainText('Error loading image');
  await expect(page.locator('img[src*="/thumbnail"]')).toHaveCount(0);

  await highlight(page, placeholder, 'New: placeholder for failed asset');
  await shot(page, 'Recently added asset shows a placeholder when it fails to load', { focus: placeholder });
});
