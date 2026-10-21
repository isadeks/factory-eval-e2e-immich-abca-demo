import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('edit date and time dialog marks the fields that were changed', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
      deviceAssetId: `changed-fields-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  await panel.getByTestId('detail-panel-edit-date-button').click();
  const dateInput = page.locator('input#datetime');
  const timezoneInput = page.getByRole('combobox', { name: /timezone/i });
  await expect(dateInput).toBeVisible();

  // nothing edited yet: no field is marked
  await expect(page.getByTestId('date-changed-indicator')).toHaveCount(0);
  await expect(page.getByTestId('changed-indicator')).toHaveCount(0);
  await shot(page, 'Dialog opened: no field is marked as changed', { focus: dateInput });

  // change only the time zone: only the time zone is marked
  await timezoneInput.focus();
  await timezoneInput.fill('Pacific/Pitcairn');
  await page.getByText(/Pacific\/Pitcairn/).first().click();
  await expect(page.getByTestId('changed-indicator')).toBeVisible();
  await expect(page.getByTestId('date-changed-indicator')).toHaveCount(0);
  await expect(dateInput).not.toHaveAttribute('data-changed', /.*/);
  await expect(timezoneInput).toHaveAttribute('data-changed', 'true');
  await highlight(page, page.getByTestId('changed-indicator'), 'New: time zone marked as changed');
  await shot(page, 'Only the time zone is marked as changed', { focus: timezoneInput });

  // now change the date as well: both are marked
  await dateInput.fill('2020-01-02T03:04:05');
  await dateInput.blur();
  await expect(page.getByTestId('date-changed-indicator')).toBeVisible();
  await expect(dateInput).toHaveAttribute('data-changed', 'true');
  await highlight(page, page.getByTestId('date-changed-indicator'), 'New: date marked as changed');
  await shot(page, 'Date and time zone are both marked as changed', { focus: dateInput });
});
