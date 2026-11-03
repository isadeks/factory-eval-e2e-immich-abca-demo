import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('edit date dialog: Reset restores a changed field to its original value', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `edit-date-reset-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: '2024-05-06T07:08:09.000Z',
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

  const dialog = page.getByRole('dialog');
  const dateInput = dialog.getByLabel('Date and Time');
  const resetDate = dialog.getByTestId('reset-date-button');
  const resetTimeZone = dialog.getByTestId('reset-timezone-button');
  await expect(dateInput).toBeVisible();
  const original = await dateInput.inputValue();
  await expect(resetDate).toHaveCount(0);

  await dateInput.fill('2020-01-02T03:04');
  await dateInput.blur();
  await expect(resetDate).toBeVisible();
  await highlight(page, resetDate, 'New: Reset');
  await shot(page, 'Changed date field shows a Reset button', { focus: dialog });

  await resetDate.click();
  await expect(dateInput).toHaveValue(original);
  await expect(resetDate).toHaveCount(0);
  await highlight(page, dateInput, 'Original value restored');
  await shot(page, 'Reset restores the original date', { focus: dialog });

  const timezone = dialog.getByRole('combobox', { name: /time ?zone/i });
  const originalZone = await timezone.inputValue();
  await timezone.click();
  await timezone.fill('Pacific/Pitcairn');
  await page.getByText(/Pacific\/Pitcairn/).first().click();
  await expect(resetTimeZone).toBeVisible();
  await shot(page, 'Changed time zone shows a Reset button', { focus: dialog });
  await resetTimeZone.click();
  await expect(timezone).toHaveValue(originalZone);
  await expect(resetTimeZone).toHaveCount(0);
});
