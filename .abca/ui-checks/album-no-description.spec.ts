import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('album page shows a "No description" placeholder to the owner', async ({ page, request }) => {
  const api = process.env.PREVIEW_API_URL!;
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const created = await request.post(`${api}/albums`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { albumName: 'No description album' },
  });
  expect(created.ok()).toBeTruthy();
  const album = await created.json();

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  const textarea = page.getByTestId('autogrow-textarea');
  await expect(textarea).toBeVisible();
  await expect(textarea).toHaveAttribute('placeholder', 'No description');
  await expect(textarea).toHaveValue('');

  await highlight(page, textarea, 'New: muted "No description" placeholder');
  await shot(page, 'Owner sees a muted No description placeholder', { focus: textarea });
});
