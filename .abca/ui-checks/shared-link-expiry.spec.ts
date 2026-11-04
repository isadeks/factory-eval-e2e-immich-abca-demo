import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('shared links list shows the expiry date or Never', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const expiresAt = new Date(Date.now() + 10 * 24 * 3600 * 1000);
  const createAlbum = async (albumName: string) => {
    const res = await request.post(`${api}/albums`, { headers, data: { albumName } });
    expect(res.ok(), await res.text()).toBeTruthy();
    return (await res.json()).id as string;
  };
  const expiringAlbumId = await createAlbum('expiring album');
  const foreverAlbumId = await createAlbum('forever album');

  const withExpiry = await request.post(`${api}/shared-links`, {
    headers,
    data: { type: 'ALBUM', albumId: expiringAlbumId, expiresAt: expiresAt.toISOString() },
  });
  const never = await request.post(`${api}/shared-links`, {
    headers,
    data: { type: 'ALBUM', albumId: foreverAlbumId },
  });
  expect(withExpiry.ok(), await withExpiry.text()).toBeTruthy();
  expect(never.ok(), await never.text()).toBeTruthy();

  await signIn(page);
  await page.goto('/shared-links');

  const cells = page.getByTestId('shared-link-expiry-date');
  await expect(cells).toHaveCount(2);

  const expiringCard = page.locator('div', { has: page.getByText('expiring album') }).filter({ has: cells }).last();
  const foreverCard = page.locator('div', { has: page.getByText('forever album') }).filter({ has: cells }).last();

  const expiringCell = expiringCard.getByTestId('shared-link-expiry-date');
  const foreverCell = foreverCard.getByTestId('shared-link-expiry-date');
  await expect(foreverCell).toHaveText('Never');
  await expect(expiringCell).not.toHaveText('Never');
  await expect(expiringCell).toHaveText(new RegExp(String(expiresAt.getFullYear())));

  await highlight(page, expiringCell, 'New: expiry date');
  await highlight(page, foreverCell, 'New: Never');
  await shot(page, 'Shared links list shows an expiry date column', { focus: cells.first() });
});
