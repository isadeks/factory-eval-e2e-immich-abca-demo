import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('info panel offers an "Open original" link that opens the original file in a new tab', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  const upload = await request.post(`${apiUrl}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      deviceAssetId: `open-original-${Date.now()}`,
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

  const link = panel.getByTestId('detail-panel-open-original');
  await expect(link).toBeVisible();
  await expect(link).toHaveText(/Open original/);
  await expect(link).toHaveAttribute('href', new RegExp(`/api/assets/${id}/original`));
  await expect(link).toHaveAttribute('target', '_blank');

  await highlight(page, link, 'New: Open original');
  await shot(page, 'Info panel shows the Open original link', { focus: link });

  const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
  await expect(popup).toHaveURL(new RegExp(`/api/assets/${id}/original`));
  await shot(page, 'Original file link opened in a new tab');
});
