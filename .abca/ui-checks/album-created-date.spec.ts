import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('albums list shows the creation date under each album title', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const albumName = `Created date ${Date.now()}`;
  const created = await request.post(`${apiUrl}/albums`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { albumName },
  });
  expect(created.ok()).toBeTruthy();
  const album = await created.json();
  const expectedDate = new Date(album.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  await signIn(page);
  await page.goto('/albums');

  const card = page.getByTestId('album-card').filter({ hasText: albumName });
  await expect(card).toBeVisible();
  const date = card.getByTestId('album-created-date');
  await expect(date).toHaveText(expectedDate);

  await highlight(page, date, 'New: creation date');
  await shot(page, 'Album card shows its creation date under the title', { focus: card });
});
