import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

const monthYear = (iso: string) =>
  new Date(iso.replace(/Z$/, '').replace(/\+.+$/, '') + 'Z').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

test('album page shows the month range of the album photos under the title', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const assetIds: string[] = [];
  for (const [file, created] of [
    ['photo-1.jpg', '2024-01-15T10:00:00.000Z'],
    ['photo-2.jpg', '2024-03-20T10:00:00.000Z'],
  ]) {
    const res = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `${file}-${Date.now()}-${Math.random()}`,
        deviceId: 'ui-check',
        fileCreatedAt: created,
        fileModifiedAt: created,
        assetData: { name: file, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)) },
      },
    });
    expect(res.ok()).toBeTruthy();
    assetIds.push((await res.json()).id);
  }

  const albumRes = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: 'Date range album', assetIds },
  });
  const album = await albumRes.json();

  // Metadata extraction rewrites asset dates from the file; wait for it, then set the dates explicitly.
  const dates = ['2024-01-15T10:00:00.000Z', '2024-03-20T10:00:00.000Z'];
  for (const [i, id] of assetIds.entries()) {
    await expect
      .poll(async () => (await (await request.get(`${api}/assets/${id}`, { headers })).json()).exifInfo?.fileSizeInByte ?? 0, {
        timeout: 60_000,
      })
      .toBeGreaterThan(0);
    const upd = await request.put(`${api}/assets/${id}`, { headers, data: { dateTimeOriginal: dates[i] } });
    expect(upd.ok()).toBeTruthy();
  }

  const expected = 'Jan 2024 – Mar 2024';
  await expect
    .poll(
      async () => {
        const info = await (await request.get(`${api}/albums/${album.id}`, { headers })).json();
        return `${monthYear(info.startDate ?? '2000-01-01T00:00:00Z')} – ${monthYear(info.endDate ?? '2000-01-01T00:00:00Z')}`;
      },
      { timeout: 60_000 },
    )
    .toBe(expected);

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  const details = page.getByTestId('album-details');
  await expect(details).toBeVisible();
  await expect(details).toContainText(expected);
  await expect(details).not.toContainText(/\d{1,2},/);

  await highlight(page, details, 'New: month range of the photos');
  await shot(page, 'Album page shows the date range under the title', { focus: details });
});
