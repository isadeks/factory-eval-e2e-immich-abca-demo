import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album page shows the description in a muted paragraph under the title', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const email = `viewer-${Date.now()}@example.com`;
  const user = await request.post(`${api}/admin/users`, {
    headers,
    data: { email, password: 'viewer-password', name: 'Viewer' },
  });
  expect(user.ok()).toBeTruthy();
  const { id: userId } = await user.json();

  const description = 'Our summer trip to the coast';
  const album = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: 'Coast trip', description, albumUsers: [{ userId, role: 'viewer' }] },
  });
  expect(album.ok()).toBeTruthy();
  const { id: albumId } = await album.json();

  // Owner can edit the description
  await signIn(page);
  await page.goto(`/albums/${albumId}`);
  await expect(page.getByTestId('autogrow-textarea')).toHaveValue(description);

  // Shared user sees it as a muted paragraph
  await page.context().clearCookies();
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('viewer-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(photos|auth\/(onboarding|change-password))/);
  await page.goto(`/albums/${albumId}`);

  const paragraph = page.getByTestId('album-description');
  await expect(paragraph).toHaveText(description);
  await expect(paragraph).toHaveClass(/text-gray-600/);
  await highlight(page, paragraph, 'New: muted description');
  await shot(page, 'Album description shown under the title', { focus: paragraph });
});
