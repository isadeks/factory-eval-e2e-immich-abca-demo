import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('info panel shows an "Open original" link under the file name for the owner', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart: {
      deviceAssetId: `open-original-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'open-original.jpg',
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

  const link = panel.getByRole('link', { name: 'Open original' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', new RegExp(`/api/assets/${id}/original`));

  // the link sits right under the file name
  const fileName = panel.getByText('open-original.jpg', { exact: false }).first();
  await expect(fileName).toBeVisible();
  const nameBox = (await fileName.boundingBox())!;
  const linkBox = (await link.boundingBox())!;
  expect(linkBox.y).toBeGreaterThan(nameBox.y);
  expect(linkBox.y - (nameBox.y + nameBox.height)).toBeLessThan(40);

  await highlight(page, link, 'New: Open original link');
  await shot(page, 'Info panel shows the Open original link under the file name', { focus: link });

  const popupPromise = page.context().waitForEvent('page');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  expect(popup.url()).toContain(`/api/assets/${id}/original`);
  await popup.close();
  await shot(page, 'Original opened in a new tab; viewer stays open', { focus: panel });
});
