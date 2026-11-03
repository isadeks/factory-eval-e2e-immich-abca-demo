import { expect, test, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

// Playwright's fill() rejects this input's value format, so set it like the browser does: input event, then blur
const setDate = async (input: Locator, value: string) => {
  await input.evaluate((el: HTMLInputElement, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.blur();
  }, value);
};

test('edit date dialog shows the original value as a tooltip on a changed field', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `tooltip-${Date.now()}`,
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

  // wait for metadata extraction so the dialog opens with the asset's real date
  await expect
    .poll(async () => (await (await request.get(`${api}/assets/${id}`, { headers })).json()).exifInfo?.dateTimeOriginal)
    .toBeTruthy();

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);
  await panel.getByTestId('detail-panel-edit-date-button').click();

  const dateInput = page.locator('#datetime');
  await expect(dateInput).toBeVisible();
  const original = await dateInput.inputValue();
  expect(original).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

  // unchanged: no tooltip, no tint
  await expect(dateInput).not.toHaveAttribute('title');
  await highlight(page, dateInput, 'Unchanged: no tooltip');
  await shot(page, 'Unchanged date field has no tint and no tooltip', { focus: dateInput });

  // change the date
  await setDate(dateInput, '2024-05-02T08:15:00.000');

  // same format as the field's own value (the browser omits zero seconds/milliseconds in inputValue)
  const expected = original.length === 16 ? `${original}:00.000` : original;
  await expect(dateInput).toHaveAttribute('title', `Was: ${expected}`);
  await expect(dateInput).toHaveClass(/bg-green/);

  await dateInput.hover();
  await highlight(page, dateInput, 'New: tooltip with the original value');
  await shot(page, `Changed field is tinted and its tooltip reads Was: ${expected}`, { focus: dateInput });

  // restoring the original value removes the tooltip again
  await setDate(dateInput, original);
  await expect(dateInput).not.toHaveAttribute('title');
});
