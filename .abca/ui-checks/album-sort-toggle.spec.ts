import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album list sort toggle switches between name and date created', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // created in this order: Charlie (oldest), Alpha, Bravo (newest)
  for (const albumName of ['SortCheck Charlie', 'SortCheck Alpha', 'SortCheck Bravo']) {
    const res = await request.post(`${api}/albums`, { headers, data: { albumName } });
    expect(res.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/albums');
  await page.evaluate(() => localStorage.removeItem('album-view-settings'));
  await page.goto('/albums');
  await page.getByRole('button', { name: /list/i }).first().click();

  const toggle = page.getByRole('group', { name: 'Sort albums by...' });
  await expect(toggle).toBeVisible();

  const names = async () =>
    (await page.getByRole('cell', { name: /^SortCheck (Alpha|Bravo|Charlie)$/ }).allTextContents()).map((n) => n.trim());

  await toggle.getByText('Name', { exact: true }).click();
  await expect.poll(names).toEqual(['SortCheck Alpha', 'SortCheck Bravo', 'SortCheck Charlie']);
  await highlight(page, toggle, 'New: Name / Date created toggle');
  await shot(page, 'Albums sorted by name', { focus: toggle });

  await toggle.getByText('Date created', { exact: true }).click();
  await expect.poll(names).toEqual(['SortCheck Bravo', 'SortCheck Alpha', 'SortCheck Charlie']);
  await highlight(page, toggle, 'New: Name / Date created toggle');
  await shot(page, 'Albums sorted by date created (newest first)', { focus: toggle });
});
