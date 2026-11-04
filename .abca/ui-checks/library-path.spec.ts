import { expect, test } from '@playwright/test';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('info panel shows the library path of an external library asset', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken, userId } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const folder = join(process.env.PREVIEW_IMPORT_DIR!, `library-path-${Date.now()}`);
  mkdirSync(folder, { recursive: true });
  copyFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'), join(folder, 'library-photo.jpg'));

  const created = await request.post(`${api}/libraries`, {
    headers,
    data: { ownerId: userId, name: 'Library path check', importPaths: [folder] },
  });
  expect(created.ok()).toBeTruthy();
  const library = await created.json();
  expect((await request.post(`${api}/libraries/${library.id}/scan`, { headers })).ok()).toBeTruthy();

  let assetId = '';
  await expect
    .poll(async () => {
      const res = await request.post(`${api}/search/metadata`, {
        headers,
        data: { libraryId: library.id, originalFileName: 'library-photo.jpg' },
      });
      assetId = (await res.json()).assets?.items?.[0]?.id ?? '';
      return assetId;
    })
    .not.toBe('');

  await signIn(page);
  await page.goto(`/photos/${assetId}`);
  const panel = await openInfoPanel(page);

  const row = panel.getByTestId('detail-panel-library');
  await expect(row).toBeVisible();
  await expect(row).toContainText('Library');
  await expect(panel.getByTestId('detail-panel-library-path')).toContainText(`${folder}/library-photo.jpg`);

  await highlight(page, row, 'New: Library path row');
  await shot(page, 'Info panel shows the library path', { focus: row });
});
