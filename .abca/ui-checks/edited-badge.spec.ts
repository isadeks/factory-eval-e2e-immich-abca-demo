import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('info panel shows a muted Edited badge only on edited assets', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = async (file: string, id: string) => {
    const res = await request.post(`${api}/assets`, {
      headers,
      multipart: {
        deviceAssetId: id,
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: { name: `${id}.jpg`, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)) },
      },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id as string;
  };

  const editedId = await upload('photo-1.jpg', `edited-${Date.now()}`);
  const plainId = await upload('photo-2.jpg', `plain-${Date.now()}`);

  await expect
    .poll(async () => (await request.get(`${api}/assets/${editedId}`, { headers })).status())
    .toBe(200);
  await expect
    .poll(async () => (await (await request.get(`${api}/assets/${editedId}`, { headers })).json()).exifInfo?.exifImageWidth ?? null, {
      timeout: 60_000,
    })
    .not.toBeNull();

  const edit = await request.put(`${api}/assets/${editedId}/edits`, {
    headers,
    data: { edits: [{ action: 'rotate', parameters: { angle: 90 } }] },
  });
  expect(edit.ok()).toBeTruthy();
  await expect
    .poll(async () => (await (await request.get(`${api}/assets/${editedId}`, { headers })).json()).isEdited)
    .toBe(true);

  await signIn(page);

  await page.goto(`/photos/${plainId}`);
  let panel = await openInfoPanel(page);
  await expect(panel.getByTestId('edited-badge')).toHaveCount(0);
  await shot(page, 'Unedited asset: no badge in the info panel');

  await page.goto(`/photos/${editedId}`);
  panel = await openInfoPanel(page);
  const badge = panel.getByTestId('edited-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText('Edited');
  await highlight(page, badge, 'New: Edited badge');
  await shot(page, 'Edited asset shows a muted Edited badge', { focus: badge });
});
