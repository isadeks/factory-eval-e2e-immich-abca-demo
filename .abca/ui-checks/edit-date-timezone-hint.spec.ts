import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('edit date dialog shows a muted hint under the timezone selector', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const upload = await request.post(`${apiUrl}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      deviceAssetId: `tz-hint-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: new Date().toISOString(),
      fileModifiedAt: new Date().toISOString(),
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
  const hint = dialog.getByTestId('timezone-hint');
  await expect(hint).toHaveText('Times are shown in the timezone you pick.');
  const timezone = dialog.getByRole('combobox', { name: /timezone/i });
  await expect(timezone).toBeVisible();

  // the hint sits below the timezone selector
  const tzBox = (await timezone.boundingBox())!;
  const hintBox = (await hint.boundingBox())!;
  expect(hintBox.y).toBeGreaterThanOrEqual(tzBox.y + tzBox.height - 1);

  await highlight(page, hint, 'New: timezone hint');
  await shot(page, 'Edit date dialog with the hint under the timezone selector', { focus: dialog });
});
