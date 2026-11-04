import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;
const assetsDir = process.env.UI_CHECK_ASSETS!;

test('timeline day headers show the number of photos', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const total = 3;
  for (let i = 1; i <= total; i++) {
    const now = new Date().toISOString();
    const response = await request.post(`${apiUrl}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `day-count-${i}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: { name: `photo-${i}.jpg`, mimeType: 'image/jpeg', buffer: readFileSync(join(assetsDir, `photo-${i}.jpg`)) },
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const counts = page.getByTestId('timeline-day-count');
  // Metadata extraction may move assets between days, so wait until every uploaded photo is counted in some header.
  const readTotal = async () => {
    const texts = await counts.allTextContents();
    return texts.reduce((sum, text) => sum + Number(/(\d+) photos?/.exec(text)?.[1] ?? 0), 0);
  };
  await expect.poll(readTotal, { timeout: 60_000 }).toBe(total);

  for (const text of await counts.allTextContents()) {
    expect(text.trim()).toMatch(/^· (1 photo|\d+ photos)$/);
    if (text.includes('1 photo')) {
      expect(text).not.toContain('photos');
    }
  }

  const first = counts.first();
  await highlight(page, first, 'New: photo count in day header');
  await shot(page, 'Day header shows the number of photos', { focus: first });
});
