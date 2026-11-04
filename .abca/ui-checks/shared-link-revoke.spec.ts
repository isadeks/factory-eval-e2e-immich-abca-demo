import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('revoking a shared link asks for confirmation and shows the link expiry', async ({
  page,
  request,
}) => {
  const login = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const albumRes = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: 'Revoke check album' },
  });
  expect(albumRes.ok()).toBeTruthy();
  const album = await albumRes.json();

  const expiresAt = new Date(Date.UTC(2099, 4, 17, 12, 0, 0)).toISOString();
  const linkRes = await request.post(`${api}/shared-links`, {
    headers,
    data: { type: 'ALBUM', albumId: album.id, expiresAt },
  });
  expect(linkRes.ok()).toBeTruthy();
  const link = await linkRes.json();

  await signIn(page);
  await page.goto('/shared-links');

  const revokeButton = page
    .getByRole('button', { name: 'Delete link' })
    .first();
  await expect(revokeButton).toBeVisible();
  await revokeButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Revoke shared link');
  await expect(dialog).toContainText(
    'Are you sure you want to revoke this shared link? It expires',
  );
  await expect(dialog).toContainText('2099');
  const confirm = dialog.getByRole('button', { name: 'Revoke' });
  await expect(confirm).toBeVisible();
  await highlight(page, dialog, 'New: revoke confirmation with expiry');
  await shot(page, 'Revoke confirmation shows when the link expires', {
    focus: dialog,
  });

  await confirm.click();
  await expect(page.getByText("You don't have any shared links")).toBeVisible();

  const after = await request.get(`${api}/shared-links/${link.id}`, {
    headers,
  });
  expect(after.status()).toBe(400);
  await shot(page, 'Link is gone after confirming');
});
