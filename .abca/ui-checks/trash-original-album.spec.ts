import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('trashed asset info panel shows its original album', async ({
  page,
  request,
}) => {
  const login = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const headers = {
    Authorization: `Bearer ${(await login.json()).accessToken}`,
  };

  const now = new Date().toISOString();
  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `trash-album-${Date.now()}`,
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
  const { id: assetId } = await upload.json();

  const albumName = `Summer trip ${Date.now()}`;
  const album = await request.post(`${api}/albums`, {
    headers,
    data: { albumName, assetIds: [assetId] },
  });
  expect(album.ok()).toBeTruthy();

  const trashed = await request.delete(`${api}/assets`, {
    headers,
    data: { ids: [assetId], force: false },
  });
  expect(trashed.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/trash');
  const thumbnail = page.locator(`[data-thumbnail-focus-container]`).first();
  await expect(thumbnail).toBeVisible({ timeout: 30_000 });
  await thumbnail.click();
  await expect(page).toHaveURL(/\/trash\/photos\//);

  const panel = await openInfoPanel(page);
  const section = panel.getByTestId('detail-panel-albums');
  await expect(section).toBeVisible();
  await expect(
    section.getByText('Original album', { exact: true }),
  ).toBeVisible();
  await expect(section.getByText(albumName)).toBeVisible();
  await expect(section.getByText('Appears in')).toHaveCount(0);

  await highlight(page, section, 'New: Original album');
  await shot(page, 'Trashed asset info panel shows its original album', {
    focus: section,
  });
});
