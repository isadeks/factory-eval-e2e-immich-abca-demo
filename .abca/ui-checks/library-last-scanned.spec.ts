import { expect, test } from '@playwright/test';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('external library list shows when each library was last scanned', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken, userId } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const importDir = join(process.env.PREVIEW_IMPORT_DIR!, `last-scanned-${Date.now()}`);
  mkdirSync(importDir, { recursive: true });
  copyFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'), join(importDir, 'photo-1.jpg'));

  const scanned = await request.post(`${api}/libraries`, {
    headers,
    data: { name: 'Scanned library', ownerId: userId, importPaths: [importDir] },
  });
  const { id: scannedId } = await scanned.json();
  await request.post(`${api}/libraries`, { headers, data: { name: 'Fresh library', ownerId: userId } });
  await request.post(`${api}/libraries/${scannedId}/scan`, { headers });

  await expect
    .poll(async () => (await (await request.get(`${api}/libraries/${scannedId}`, { headers })).json()).refreshedAt, {
      timeout: 60_000,
    })
    .not.toBeNull();

  await signIn(page);
  await page.goto('/admin/library-management');

  const scannedRow = page.getByRole('row', { name: /Scanned library/ });
  const freshRow = page.getByRole('row', { name: /Fresh library/ });

  const scannedLabel = scannedRow.getByTestId('library-last-scanned');
  await expect(scannedLabel).toContainText('Last scanned:');
  await expect(scannedLabel.locator('time')).toBeVisible();
  await highlight(page, scannedLabel, 'New: Last scanned');
  await shot(page, 'Scanned library shows its last scan time', { focus: scannedRow });

  const freshLabel = freshRow.getByTestId('library-last-scanned');
  await expect(freshLabel).toContainText('Last scanned: Never');
  await highlight(page, freshLabel, 'New: Never scanned');
  await shot(page, 'Unscanned library shows Never', { focus: freshRow });
});
