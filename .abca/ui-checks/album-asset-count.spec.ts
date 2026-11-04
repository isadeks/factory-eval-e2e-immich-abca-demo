import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album page shows the asset count in a pill next to the title', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const assetIds: string[] = [];
  for (const n of [1, 2, 3]) {
    const now = new Date().toISOString();
    const res = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `album-count-${Date.now()}-${n}`,
        deviceId: 'ui-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: {
          name: `photo-${n}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    assetIds.push((await res.json()).id);
  }

  const albumRes = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: 'Count check album', assetIds },
  });
  expect(albumRes.ok()).toBeTruthy();
  const album = await albumRes.json();

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  const pill = page.getByTestId('album-asset-count');
  await expect(pill).toHaveText('3 items');
  await expect(page.getByRole('textbox', { name: /title/i }).first()).toHaveValue('Count check album');

  await highlight(page, pill, 'New: asset count pill');
  await shot(page, 'Album header shows the number of items next to the title', { focus: pill });
});
