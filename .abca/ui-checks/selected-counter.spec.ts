import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('photos page shows a "Selected: n" counter while selecting', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  for (const n of [1, 2, 3]) {
    const upload = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `selected-counter-${n}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date(2026, 0, 1, 12, n).toISOString(),
        fileModifiedAt: new Date(2026, 0, 1, 12, n).toISOString(),
        assetData: {
          name: `photo-${n}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`)),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const thumbnails = page.locator('[data-thumbnail-focus-container]');
  await expect(thumbnails).toHaveCount(3);
  await expect(page.getByTestId('selected-counter')).toHaveCount(0);

  const select = async (index: number) => {
    const thumbnail = thumbnails.nth(index);
    await thumbnail.hover();
    await thumbnail.getByRole('checkbox').click();
  };

  const counter = page.getByTestId('selected-counter');

  await select(0);
  await expect(counter.getByText('Selected: 1')).toBeVisible();
  await highlight(page, counter, 'New: Selected: 1');
  await shot(page, 'Counter shows Selected: 1 after selecting one photo', { focus: counter });

  await select(1);
  await expect(counter.getByText('Selected: 2')).toBeVisible();
  await select(2);
  await expect(counter.getByText('Selected: 3')).toBeVisible();
  await highlight(page, counter, 'New: Selected: 3');
  await shot(page, 'Counter shows Selected: 3 after selecting three photos', { focus: counter });

  await page.keyboard.press('Escape');
  await expect(counter).toHaveCount(0);
});
