import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('edit date modal highlights the fields that were changed', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${apiUrl}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `change-date-indicator-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);
  await panel.getByTestId('detail-panel-edit-date-button').click();

  const dateInput = page.locator('input#datetime');
  const timezoneInput = page.getByRole('combobox', { name: /time ?zone/i });
  await expect(dateInput).toBeVisible();
  await expect(dateInput).not.toHaveAttribute('data-changed', 'true');
  await expect(timezoneInput).not.toHaveAttribute('data-changed', 'true');
  await shot(page, 'Edit date dialog before any change', { focus: page.locator('[data-dialog-content]') });

  // change only the time zone
  await timezoneInput.click();
  await timezoneInput.fill('Pacific/Pitcairn');
  await page.getByRole('option', { name: /Pacific\/Pitcairn/ }).click();
  await expect(timezoneInput).toHaveAttribute('data-changed', 'true');
  await expect(dateInput).not.toHaveAttribute('data-changed', 'true');
  await highlight(page, timezoneInput, 'Changed: time zone is tinted');
  await shot(page, 'Only the changed time zone is highlighted', { focus: page.locator('[data-dialog-content]') });

  // now change the date as well
  await dateInput.fill('2020-05-06T07:08:09.123');
  await dateInput.blur();
  await expect(dateInput).toHaveAttribute('data-changed', 'true');
  await expect(timezoneInput).toHaveAttribute('data-changed', 'true');
  await highlight(page, dateInput, 'Changed: date is tinted');
  await shot(page, 'Both changed fields are highlighted', { focus: page.locator('[data-dialog-content]') });
});
