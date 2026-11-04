import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('info panel shows the date an asset was favorited', async ({
  page,
  request,
}) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = async (file: string) => {
    const now = new Date().toISOString();
    const response = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `favorited-at-${file}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: {
          name: file,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)),
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).id as string;
  };

  const favoriteId = await upload('photo-1.jpg');
  const plainId = await upload('photo-2.jpg');

  const update = await request.put(`${apiUrl}/assets/${favoriteId}`, {
    headers,
    data: { isFavorite: true },
  });
  expect(update.ok()).toBeTruthy();

  await signIn(page);

  // A non-favorite asset shows no "Favorited" row.
  await page.goto(`/photos/${plainId}`);
  const plainPanel = await openInfoPanel(page);
  await expect(
    plainPanel.getByTestId('detail-panel-edit-date-button'),
  ).toBeVisible();
  await expect(plainPanel.getByTestId('detail-panel-favorited-at')).toHaveCount(
    0,
  );

  // A favorite asset shows the date it was favorited.
  await page.goto(`/photos/${favoriteId}`);
  const panel = await openInfoPanel(page);
  const row = panel.getByTestId('detail-panel-favorited-at');
  await expect(row).toBeVisible();
  await expect(row).toContainText('Favorited');
  await expect(row).toContainText(String(new Date().getFullYear()));

  await highlight(page, row, 'New: Favorited date');
  await shot(page, 'Info panel shows the date the photo was favorited', {
    focus: row,
  });
});
