import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('timeline grid size preference persists across reloads', async ({
  page,
  request,
}) => {
  const login = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  // Upload a few sample photos so the timeline has a grid to resize.
  for (const n of [1, 2, 3]) {
    const upload = await request.post(`${api}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `grid-size-${n}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name: `photo-${n}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(
            join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`),
          ),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const selector = page.getByTestId('timeline-grid-size');
  const thumbnails = page.locator('[data-thumbnail-focus-container]');
  await expect(selector).toBeVisible();
  await expect(thumbnails.first()).toBeVisible();

  const medium = selector.getByRole('button', { name: 'Medium', exact: true });
  const large = selector.getByRole('button', { name: 'Large', exact: true });
  const small = selector.getByRole('button', { name: 'Small', exact: true });

  await expect(medium).toHaveAttribute('aria-pressed', 'true');
  const mediumHeight = (await thumbnails.first().boundingBox())!.height;
  await highlight(page, selector, 'New: grid size selector');
  await shot(page, 'Default grid size is Medium', { focus: selector });

  await large.click();
  await expect(large).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(async () => (await thumbnails.first().boundingBox())!.height)
    .toBeGreaterThan(mediumHeight);
  await highlight(page, selector, 'Large selected');
  await shot(page, 'Large grid size enlarges the thumbnails', {
    focus: selector,
  });

  await page.reload();
  await expect(thumbnails.first()).toBeVisible();
  await expect(large).toHaveAttribute('aria-pressed', 'true');
  await expect(medium).toHaveAttribute('aria-pressed', 'false');
  const largeHeight = (await thumbnails.first().boundingBox())!.height;
  expect(largeHeight).toBeGreaterThan(mediumHeight);
  await highlight(page, selector, 'Still Large after reload');
  await shot(page, 'The preference survives a page reload', {
    focus: selector,
  });

  await small.click();
  await expect(small).toHaveAttribute('aria-pressed', 'true');
  await expect(large).toHaveAttribute('aria-pressed', 'false');
  expect(
    await page.evaluate(() => localStorage.getItem('timeline-grid-size')),
  ).toBe('small');
});
