import { expect, request, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('edit date and time dialog highlights only the fields that were changed', async ({ page }) => {
  // setup: upload one photo through the API
  const api = await request.newContext();
  const login = await api.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  const upload = await api.post(`${apiUrl}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      deviceAssetId: `date-change-indicator-${Date.now()}`,
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

  // open the date dialog from the info panel
  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);
  await panel.getByTestId('detail-panel-edit-date-button').click();

  const dialog = page.getByRole('dialog');
  const dateInput = dialog.getByLabel('Date and Time');
  const timezoneInput = dialog.getByRole('combobox', { name: 'Timezone' });
  await expect(dateInput).toBeVisible();

  // nothing changed yet: no field is highlighted
  await expect(dateInput).not.toHaveClass(/immich-form-input-changed/);
  await expect(timezoneInput).not.toHaveClass(/immich-form-input-changed/);
  await shot(page, 'Dialog opened, nothing is highlighted', { focus: dialog });

  // change only the timezone
  const original = await timezoneInput.inputValue();
  const target = original.startsWith('Pacific/Pitcairn') ? 'Asia/Tokyo' : 'Pacific/Pitcairn';
  await timezoneInput.click();
  await timezoneInput.fill(target);
  await dialog.getByRole('option', { name: new RegExp(`^${target}`) }).click();

  await expect(timezoneInput).toHaveClass(/immich-form-input-changed/);
  await expect(dateInput).not.toHaveClass(/immich-form-input-changed/);
  await highlight(page, timezoneInput, 'Changed: timezone');
  await highlight(page, dateInput, 'Unchanged: date');
  await shot(page, 'Only the changed timezone is highlighted', { focus: dialog });

  // now change the date as well
  await dateInput.fill('2020-05-17T10:20:30.123');
  await dateInput.blur();
  await expect(dateInput).toHaveClass(/immich-form-input-changed/);
  await expect(timezoneInput).toHaveClass(/immich-form-input-changed/);
  await highlight(page, dateInput, 'Changed: date');
  await shot(page, 'Both changed fields are highlighted', { focus: dialog });

  // reverting the timezone removes its highlight again
  await dialog.getByRole('button', { name: 'Clear value' }).click();
  await timezoneInput.fill(original.replace(/ \(.*$/, ''));
  await dialog.getByRole('option', { name: new RegExp(`^${original.replace(/ \(.*$/, '')}`) }).first().click();
  await expect(timezoneInput).not.toHaveClass(/immich-form-input-changed/);
  await expect(dateInput).toHaveClass(/immich-form-input-changed/);
});
