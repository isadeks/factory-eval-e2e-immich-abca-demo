import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('asset viewer toolbar shows the ← → keyboard hint', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();

  const upload = async (name: string) => {
    const res = await request.post(`${api}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `${name}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)),
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id as string;
  };
  const id = await upload('photo-1.jpg');

  await signIn(page);
  await page.goto(`/photos/${id}`);

  const hint = page.getByTestId('asset-viewer-navigation-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText('← →');
  await highlight(page, hint, 'New: ← → hint');
  await shot(page, 'Toolbar shows the ← → next/previous hint', { focus: hint });
});
