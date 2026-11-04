import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;
const assetsDir = process.env.UI_CHECK_ASSETS!;

test('timeline shows a Back to top button after scrolling more than one screen', async ({
  page,
  request,
}) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // many assets on distinct days, so the timeline is taller than a few screens
  const bytes = readFileSync(join(assetsDir, 'photo-1.jpg'));
  const stamp = Date.now();
  for (let i = 0; i < 40; i++) {
    const date = new Date(
      Date.UTC(2023, i % 12, 1 + Math.floor(i / 12) * 3, 12),
    ).toISOString();
    const res = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `back-to-top-${stamp}-${i}`,
        deviceId: 'ui-check',
        fileCreatedAt: date,
        fileModifiedAt: date,
        assetData: {
          name: `back-to-top-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: Buffer.concat([bytes, Buffer.from(`${stamp}-${i}`)]),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');
  const timeline = page.locator('#asset-grid');
  const button = page.getByTestId('back-to-top-button');

  await expect(timeline).toBeVisible();
  await expect(
    page.locator('[data-thumbnail-focus-container]').first(),
  ).toBeVisible();
  await expect(button).toHaveCount(0);
  await shot(page, 'Top of the timeline has no Back to top button');

  const viewportHeight = await timeline.evaluate((el) => el.clientHeight);
  await timeline.evaluate(
    (el, h) => el.scrollTo({ top: h * 2 }),
    viewportHeight,
  );
  await expect(button).toBeVisible();
  await highlight(page, button, 'New: Back to top button');
  await shot(page, 'Back to top button appears after scrolling down', {
    focus: button,
  });

  await button.click();
  await expect.poll(() => timeline.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(button).toHaveCount(0);
  await shot(page, 'Clicking the button scrolls back to the top and hides it');
});
