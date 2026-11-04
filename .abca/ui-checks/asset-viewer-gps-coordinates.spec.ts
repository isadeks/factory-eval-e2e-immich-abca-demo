import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('asset viewer shows GPS coordinates with a copy button', async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const login = await request.post(`${API}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `gps-${Date.now()}`,
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

  const update = await request.put(`${API}/assets/${id}`, {
    headers,
    data: { latitude: 48.8584, longitude: 2.2945 },
  });
  expect(update.ok()).toBeTruthy();

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  const row = panel.getByTestId('detail-panel-coordinates');
  await expect(row).toBeVisible();
  await expect(panel.getByTestId('detail-panel-coordinates-text')).toHaveText(
    '48.8584, 2.2945',
  );
  await highlight(page, row, 'New: GPS coordinates + copy');
  await shot(page, 'Info panel shows the GPS coordinates with a copy button', {
    focus: row,
  });

  await panel.getByTestId('detail-panel-coordinates-copy').click();
  await expect(page.getByText('Copied to clipboard!')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('48.8584, 2.2945');
  await shot(page, 'Coordinates copied to the clipboard');
});
