import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('shows a toast after uploading assets into an album', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const albumName = `Toast album ${Date.now()}`;
  const albumRes = await request.post(`${api}/albums`, { headers, data: { albumName } });
  expect(albumRes.ok()).toBeTruthy();
  const album = await albumRes.json();

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  await page.getByRole('button', { name: 'Add photos', exact: true }).first().click();
  const uploadItem = page.getByRole('button', { name: /Select from computer/ });
  await expect(uploadItem).toBeVisible();
  const chooser = page.waitForEvent('filechooser');
  await uploadItem.click();
  await (
    await chooser
  ).setFiles([join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'), join(process.env.UI_CHECK_ASSETS!, 'photo-2.jpg')]);

  const toast = page.getByText('Added 2 assets to the album');
  await expect(toast).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Album' })).toBeVisible();
  await highlight(page, toast, 'New: toast after adding to album');
  await shot(page, 'Toast confirms the uploaded assets were added to the album', { focus: toast });
});
