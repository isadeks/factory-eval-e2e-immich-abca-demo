import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

const api = process.env.PREVIEW_API_URL ?? '';
const longName = 'A really long album name '.repeat(8).trim();

test('album page shows the full title as a tooltip when it is truncated', async ({ page, request }) => {
  const adminLogin = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminHeaders = { Authorization: `Bearer ${(await adminLogin.json()).accessToken}` };

  const email = `viewer-${Date.now()}@example.com`;
  const password = 'viewer-password-1';
  const userResponse = await request.post(`${api}/admin/users`, {
    headers: adminHeaders,
    data: { email, password, name: 'Viewer', shouldChangePassword: false },
  });
  expect(userResponse.ok()).toBeTruthy();
  const viewer = await userResponse.json();

  const albumResponse = await request.post(`${api}/albums`, {
    headers: adminHeaders,
    data: { albumName: longName, albumUsers: [{ userId: viewer.id, role: 'viewer' }] },
  });
  expect(albumResponse.ok()).toBeTruthy();
  const album = await albumResponse.json();

  // Sign the (non-owner) viewer in through the API; the browser context keeps the session cookies.
  const login = await page.context().request.post(`${api}/auth/login`, { data: { email, password } });
  expect(login.ok()).toBeTruthy();

  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto(`/albums/${album.id}`);

  const title = page.getByTestId('album-title');
  await expect(title).toHaveText(longName);
  await expect(title).not.toHaveAttribute('title');
  await highlight(page, title, 'Title is truncated');
  await shot(page, 'Long album title is truncated on one line', { focus: title });

  await title.hover();
  await expect(title).toHaveAttribute('title', longName);
  await highlight(page, title, 'New: full name tooltip (title attribute)');
  await shot(page, 'Hovering the truncated title exposes the full album name', { focus: title });
});
