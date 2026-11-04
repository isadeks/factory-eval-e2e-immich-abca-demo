import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const ASSETS = process.env.UI_CHECK_ASSETS!;

test('timeline has a Jump to date button that accepts a date', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();

  const dates = ['2020-03-10T12:00:00.000Z', '2022-06-15T12:00:00.000Z'];
  for (const [i, createdAt] of dates.entries()) {
    const res = await request.post(`${API}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `jump-to-date-${Date.now()}-${i}`,
        deviceId: 'ui-check',
        fileCreatedAt: createdAt,
        fileModifiedAt: createdAt,
        assetData: {
          name: `photo-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(ASSETS, `photo-${i + 1}.jpg`)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const button = page.getByTestId('jump-to-date-button');
  await expect(button).toBeVisible();
  await expect(button).toHaveText(/Jump to date/);
  await highlight(page, button, 'New: Jump to date button');
  await shot(page, 'Timeline shows the Jump to date button', { focus: button });

  await button.click();
  const input = page.getByTestId('jump-to-date-input');
  await expect(input).toBeVisible();
  await highlight(page, input, 'Date input');
  await shot(page, 'Clicking the button reveals a date input', { focus: input });

  await input.fill('2020-03-10');
  await expect(input).toBeHidden();
  await expect(button).toBeVisible();
  await shot(page, 'Picking a date jumps the timeline and closes the input');
});
