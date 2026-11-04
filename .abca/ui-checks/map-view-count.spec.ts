import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('map overlay shows the number of photos in the current view', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const locations = [
    { file: 'photo-1.jpg', latitude: 48.8566, longitude: 2.3522 },
    { file: 'photo-2.jpg', latitude: 48.8606, longitude: 2.3376 },
    { file: 'photo-3.jpg', latitude: 48.8584, longitude: 2.2945 },
  ];

  for (const { file, latitude, longitude } of locations) {
    const now = new Date().toISOString();
    const upload = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `map-view-count-${file}-${Date.now()}`,
        deviceId: 'map-view-count',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: { name: file, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)) },
      },
    });
    expect(upload.ok()).toBeTruthy();
    const { id } = await upload.json();
    const update = await request.put(`${api}/assets/${id}`, { headers, data: { latitude, longitude } });
    expect(update.ok()).toBeTruthy();
  }

  await expect
    .poll(async () => {
      const res = await request.get(`${api}/map/markers`, { headers });
      return (await res.json()).length;
    })
    .toBe(3);

  await signIn(page);

  // zoomed on Paris: all three photos are in view
  await page.goto('/map#12/48.8566/2.3376');
  const count = page.getByTestId('map-view-count');
  await expect(count).toHaveText('3 photos in view');
  await highlight(page, count, 'New: photo count in view');
  await shot(page, 'Map overlay counts all photos in view', { focus: count });

  // zoomed far away from Paris: nothing in view
  await page.goto('/map#12/-33.8688/151.2093');
  await expect(count).toHaveText('0 photos in view');
  await highlight(page, count, 'Count follows the view');
  await shot(page, 'Map overlay shows 0 photos elsewhere', { focus: count });
});
