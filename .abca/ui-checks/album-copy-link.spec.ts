import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL as string;

test('album page shows a Copy link button next to Share for albums with a shared link', async ({ page, context, playwright }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // separate request context so the API login does not sign the browser in
  const api = await playwright.request.newContext();
  const login = await api.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const sharedAlbum = await (
    await api.post(`${apiUrl}/albums`, { headers, data: { albumName: 'Shared album' } })
  ).json();
  const plainAlbum = await (
    await api.post(`${apiUrl}/albums`, { headers, data: { albumName: 'Plain album' } })
  ).json();
  const linkResponse = await api.post(`${apiUrl}/shared-links`, {
    headers,
    data: { type: 'ALBUM', albumId: sharedAlbum.id },
  });
  expect(linkResponse.ok()).toBeTruthy();
  const link = await linkResponse.json();

  await signIn(page);

  await page.goto(`/albums/${plainAlbum.id}`);
  await expect(page.getByRole('button', { name: 'Share', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toHaveCount(0);
  await shot(page, 'Album without a shared link has no Copy link button');

  await page.goto(`/albums/${sharedAlbum.id}`);
  const copyLink = page.getByRole('button', { name: 'Copy link' }).first();
  await expect(copyLink).toBeVisible();
  await highlight(page, copyLink, 'New: Copy link');
  await shot(page, 'Shared album shows Copy link next to Share', { focus: copyLink });

  await copyLink.click();
  await expect(page.getByText('Copied to clipboard').first()).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain(`/share/${link.key}`);
  await shot(page, 'Clicking Copy link copies the shared link URL');
});
