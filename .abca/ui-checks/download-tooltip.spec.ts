import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;
const fileName = 'holiday-download-check.jpg';

test('asset viewer download button tooltip shows the original file name', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  const upload = await request.post(`${apiUrl}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      assetData: {
        name: fileName,
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
      deviceAssetId: `download-tooltip-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  await signIn(page);
  await page.goto(`/photos/${id}`);

  const navbar = page.getByTestId('asset-viewer-navbar-actions');
  const button = navbar.getByRole('button', { name: `Download ${fileName}` });
  await expect(button).toBeVisible();

  await button.hover();
  const tooltip = page.getByText(`Download ${fileName}`, { exact: true }).and(page.locator(':not([aria-label])'));
  await expect(tooltip).toBeVisible();

  await highlight(page, button, 'New: tooltip includes file name');
  await shot(page, 'Download button tooltip shows the original file name', { focus: button });
});
