import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;
const assetsDir = process.env.UI_CHECK_ASSETS!;
const photoCount = 3;

test('timeline header shows the total number of photos', async ({
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

  for (let i = 1; i <= photoCount; i++) {
    const upload = await request.post(`${apiUrl}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `ui-check-count-${i}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date(2024, 0, i).toISOString(),
        fileModifiedAt: new Date(2024, 0, i).toISOString(),
        assetData: {
          name: `photo-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(assetsDir, `photo-${i}.jpg`)),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/photos');

  const pill = page.getByTestId('timeline-asset-count');
  await expect(pill).toHaveText(String(photoCount));
  await highlight(page, pill, 'New: total photo count');
  await shot(
    page,
    `Timeline header shows ${photoCount} photos in a muted pill`,
    { focus: pill },
  );
});
