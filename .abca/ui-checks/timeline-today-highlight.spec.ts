import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('timeline highlights the Today group header', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date();
  const older = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const upload = async (file: string, date: Date, id: string) => {
    const res = await request.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: id,
        deviceId: 'ui-check',
        fileCreatedAt: date.toISOString(),
        fileModifiedAt: date.toISOString(),
        assetData: { name: `${id}.jpg`, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)) },
      },
    });
    expect(res.ok()).toBeTruthy();
    const { id: assetId } = await res.json();
    // Metadata extraction overwrites the date from EXIF; set the date explicitly, retrying until the job is done.
    await expect(async () => {
      const put = await request.put(`${API}/assets/${assetId}`, { headers, data: { dateTimeOriginal: date.toISOString() } });
      expect(put.ok()).toBeTruthy();
      const info = await (await request.get(`${API}/assets/${assetId}`, { headers })).json();
      expect(new Date(info.localDateTime).toDateString()).toBe(date.toDateString());
    }).toPass();
  };
  await upload('photo-1.jpg', now, `today-${Date.now()}`);
  await upload('photo-2.jpg', older, `older-${Date.now()}`);

  await signIn(page);
  await page.goto('/photos');

  const todayTitle = page.locator('[data-testid="timeline-day-title"][data-today="true"]');
  await expect(todayTitle).toHaveCount(1);
  await expect(todayTitle).toHaveText(/today/i);
  await expect(todayTitle).toHaveClass(/text-primary/);

  const otherTitles = page.locator('[data-testid="timeline-day-title"]:not([data-today="true"])');
  await expect(otherTitles.first()).toBeVisible();
  await expect(otherTitles.first()).not.toHaveClass(/text-primary/);

  await highlight(page, todayTitle, 'New: accented Today header');
  await shot(page, 'Today group header uses the accent colour', { focus: todayTitle });
  await highlight(page, otherTitles.first(), 'Other dates unchanged');
  await shot(page, 'Older date groups keep the default colour', { focus: otherTitles.first() });
});
