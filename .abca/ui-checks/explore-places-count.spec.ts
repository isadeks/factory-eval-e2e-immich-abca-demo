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

  // The instance is fresh: metadata extraction (and with it reverse geocoding) only starts once the server has
  // imported its geodata, which can take a while on a busy runner, so allow for it.
  test.setTimeout(300_000);

  const getAsset = async (id: string) => (await request.get(`${API}/assets/${id}`, { headers })).json();

  // Explore only lists a city once it has at least 5 image assets, so upload 5 distinct copies per place
  // (trailing bytes change the checksum without affecting the JPEG).
  const sample = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  const uploads = places.flatMap((coordinates, placeIndex) =>
    Array.from({ length: 5 }, (_, copy) => ({ coordinates, unique: `${placeIndex}-${copy}` })),
  );
  const assets = await Promise.all(
    uploads.map(async ({ coordinates, unique }) => {
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
      return { id, coordinates };
    }),
  );

  // Metadata extraction would overwrite coordinates set before it finishes, so wait for it first.
  for (const { id } of assets) {
    await expect
      .poll(async () => (await getAsset(id)).exifInfo?.exifImageWidth, {
        message: `metadata extraction of ${id}`,
        timeout: 150_000,
      })
      .toBeTruthy();
  }

  // Setting coordinates writes a sidecar, which re-runs metadata extraction and reverse geocodes the city.
  await Promise.all(
    assets.map(async ({ id, coordinates }) => {
      const update = await request.put(`${API}/assets/${id}`, { headers, data: coordinates });
      expect(update.ok()).toBeTruthy();
    }),
  );

  await expect
    .poll(
      async () => {
        const response = await request.get(`${API}/search/explore`, { headers });
        const body = (await response.json()) as { fieldName: string; items: unknown[] }[];
        return body.find((entry) => entry.fieldName === 'exifInfo.city')?.items.length ?? 0;
      },
      { message: 'cities listed by /search/explore', timeout: 120_000 },
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
