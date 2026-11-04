import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album list shows a lock icon on albums shared with a password', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const createAlbum = async (albumName: string) => {
    const res = await request.post(`${api}/albums`, { headers, data: { albumName } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()) as { id: string };
  };
  const createLink = async (albumId: string, password?: string) => {
    const res = await request.post(`${api}/shared-links`, { headers, data: { type: 'ALBUM', albumId, password } });
    expect(res.ok()).toBeTruthy();
  };

  const locked = await createAlbum('Locked album');
  const open = await createAlbum('Open link album');
  await createAlbum('Private album');
  await createLink(locked.id, 'secret');
  await createLink(open.id);

  await signIn(page);
  await page.goto('/albums');

  const card = (name: string) => page.getByTestId('album-card').filter({ hasText: name });
  await expect(card('Locked album')).toBeVisible();
  await expect(card('Open link album')).toBeVisible();
  await expect(card('Private album')).toBeVisible();

  const lockIcon = card('Locked album').getByTestId('album-password-protected-icon');
  await expect(lockIcon).toBeVisible();
  await expect(lockIcon).toHaveAttribute('aria-label', 'Shared with a password');
  await expect(card('Open link album').getByTestId('album-password-protected-icon')).toHaveCount(0);
  await expect(card('Private album').getByTestId('album-password-protected-icon')).toHaveCount(0);

  await highlight(page, lockIcon, 'New: lock icon');
  await shot(page, 'Album shared with a password shows a lock icon', { focus: card('Locked album') });
  await highlight(page, card('Open link album'), 'No lock: link without password');
  await shot(page, 'Album shared without a password has no lock icon', { focus: card('Open link album') });
});
