import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('map shows a Fit all button that fits the view to all markers', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const places = [
    { file: 'photo-1.jpg', latitude: 48.1, longitude: 11.5 },
    { file: 'photo-2.jpg', latitude: -33.9, longitude: 151.2 },
  ];
  for (const [index, place] of places.entries()) {
    const upload = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `fit-all-${Date.now()}-${index}`,
        deviceId: 'fit-all-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name: place.file,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, place.file)),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
    const { id } = await upload.json();
    const update = await request.put(`${api}/assets/${id}`, {
      headers,
      data: { latitude: place.latitude, longitude: place.longitude },
    });
    expect(update.ok()).toBeTruthy();
  }

  await signIn(page);
  // start zoomed out on an empty part of the world so the view clearly changes when fitting
  await page.goto('/map#1/-60/-150');

  const fitAll = page.locator('button[title="Fit all"]');
  await expect(fitAll).toBeVisible({ timeout: 60_000 });
  const initialHash = new URL(page.url()).hash;
  await highlight(page, fitAll, 'New: Fit all');
  await shot(page, 'Map with the Fit all button', { focus: fitAll });

  await fitAll.click();
  await expect.poll(() => new URL(page.url()).hash, { timeout: 30_000 }).not.toBe(initialHash);

  // the fitted view is centred between Munich and Sydney (lat ~7, lng ~81), not on the starting position
  await expect
    .poll(() => {
      const [, lat, lng] = new URL(page.url()).hash.slice(1).split('/').map(Number);
      return Math.abs(lat - 7.1) < 15 && Math.abs(lng - 81.35) < 15;
    })
    .toBe(true);
  await shot(page, 'View fitted to all photo locations');
});
