import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

test('edit date dialog shows a Ctrl+Enter hint on the confirm button', async ({ page, request }) => {
  const api = process.env.PREVIEW_API_URL!;
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `hint-${Date.now()}`,
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
  const { id } = await upload.json();

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  await panel.getByTestId('detail-panel-edit-date-button').click();

  const dialog = page.getByRole('dialog');
  const confirm = dialog.getByRole('button', { name: /confirm/i });
  await expect(confirm).toBeVisible();
  const hint = confirm.getByTestId('submit-shortcut-hint');
  await expect(hint).toHaveText('Ctrl+Enter');

  await highlight(page, confirm, 'New: Ctrl+Enter hint');
  await shot(page, 'Confirm button shows a muted Ctrl+Enter hint', { focus: confirm });
});
