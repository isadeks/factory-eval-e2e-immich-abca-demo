import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('people page: name input shows the full name as a tooltip', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const longName = 'Bartholomew Maximilian Featherstonehaugh-Cholmondeley the Third';
  const created = await request.post(`${API}/people`, { headers, data: { name: longName } });
  expect(created.ok()).toBeTruthy();
  const person = await created.json();

  // a person is only listed when it has a face on a timeline asset
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `people-tooltip-${Date.now()}`,
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
  const asset = await upload.json();
  const face = await request.post(`${API}/faces`, {
    headers,
    data: {
      assetId: asset.id,
      personId: person.id,
      imageWidth: 100,
      imageHeight: 100,
      x: 10,
      y: 10,
      width: 50,
      height: 50,
    },
  });
  expect(face.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/people');

  const input = page.locator(`input[title="${longName}"]`);
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(longName);
  await expect(input).toHaveAttribute('title', longName);

  await highlight(page, input, 'New: title tooltip with full name');
  await shot(page, 'Truncated person name carries the full name as its tooltip', { focus: input });
});
