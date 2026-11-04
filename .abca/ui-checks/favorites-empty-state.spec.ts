import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('favorites page shows an empty-state message when there are no favorites', async ({ page, request }) => {
  // Other checks run against the same instance and may leave favorites behind; start from none.
  const api = process.env.PREVIEW_API_URL!;
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const search = await request.post(`${api}/search/metadata`, { headers, data: { isFavorite: true, size: 1000 } });
  expect(search.ok()).toBeTruthy();
  const ids: string[] = (await search.json()).assets.items.map((asset: { id: string }) => asset.id);
  if (ids.length > 0) {
    const update = await request.put(`${api}/assets`, { headers, data: { ids, isFavorite: false } });
    expect(update.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/favorites');

  const empty = page.getByTestId('favorites-empty-state');
  await expect(empty).toBeVisible();
  await expect(empty.getByText('No favorites yet')).toBeVisible();
  await expect(empty.locator('svg')).toBeVisible();

  await highlight(page, empty, 'New: empty state');
  await shot(page, 'Favorites page shows "No favorites yet" with a heart icon', { focus: empty });
});
