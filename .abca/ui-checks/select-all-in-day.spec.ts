import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('select all in this day checkbox selects every asset of the day', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  for (const n of [1, 2]) {
    const res = await request.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `select-day-${n}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: {
          name: `photo-${n}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const thumbnails = page.locator('[data-thumbnail-focus-container]');
  await expect(thumbnails.first()).toBeVisible();

  const day = page.locator('section[data-group]').first();
  await day.hover();
  const checkbox = day.getByRole('checkbox', { name: 'Select all in this day' });
  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();
  await highlight(page, checkbox, 'New: Select all in this day');
  await shot(page, 'Day header shows the select-all checkbox', { focus: day.locator('div').first() });

  const total = await day.locator('[data-asset-id]').count();
  expect(total).toBeGreaterThan(0);
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText(`${total} selected`)).toBeVisible();
  await shot(page, 'All assets of the day are selected');

  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText(`${total} selected`)).toBeHidden();
});
