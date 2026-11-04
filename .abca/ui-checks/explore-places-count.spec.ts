import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const places = [
  { latitude: 48.85341, longitude: 2.3488 }, // Paris
  { latitude: 35.6895, longitude: 139.69171 }, // Tokyo
  { latitude: 52.52437, longitude: 13.41053 }, // Berlin
];

test('Explore shows the number of places next to the Places title', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Explore only lists a city once it has at least 5 image assets, so upload 5 distinct copies per place
  // (trailing bytes change the checksum without affecting the JPEG).
  const sample = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  for (const [placeIndex, coordinates] of places.entries()) {
    for (let copy = 0; copy < 5; copy++) {
      const unique = `${placeIndex}-${copy}`;
      const upload = await request.post(`${API}/assets`, {
        headers,
        multipart: {
          deviceAssetId: `explore-places-count-${unique}`,
          deviceId: 'ui-check',
          fileCreatedAt: new Date().toISOString(),
          fileModifiedAt: new Date().toISOString(),
          assetData: {
            name: `place-${unique}.jpg`,
            mimeType: 'image/jpeg',
            buffer: Buffer.concat([sample, Buffer.from(`unique-${unique}`)]),
          },
        },
      });
      expect(upload.ok()).toBeTruthy();
      const { id } = await upload.json();
      const update = await request.put(`${API}/assets/${id}`, { headers, data: coordinates });
      expect(update.ok()).toBeTruthy();
    }
  }

  // wait for metadata extraction / reverse geocoding to produce the three cities
  await expect
    .poll(
      async () => {
        const response = await request.get(`${API}/search/explore`, { headers });
        const body = (await response.json()) as { fieldName: string; items: unknown[] }[];
        return body.find((entry) => entry.fieldName === 'exifInfo.city')?.items.length ?? 0;
      },
      { timeout: 90_000 },
    )
    .toBe(places.length);

  await signIn(page);
  await page.goto('/explore');

  const count = page.getByTestId('places-count');
  await expect(count).toBeVisible();
  await expect(count).toHaveText(`(${places.length})`);
  await expect(count.locator('..')).toHaveText(`Places (${places.length})`);

  await highlight(page, count, 'New: place count');
  await shot(page, 'Places header shows the number of places', { focus: count });
});
