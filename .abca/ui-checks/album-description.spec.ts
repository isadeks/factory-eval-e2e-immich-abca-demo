import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album page shows the description in a muted paragraph under the title', async ({
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

  const email = `viewer-${Date.now()}@example.com`;
  const user = await request.post(`${api}/admin/users`, {
    headers,
    data: { email, password: 'viewer-password', name: 'Viewer' },
  });
  expect(user.ok()).toBeTruthy();
  const { id: userId } = await user.json();

  const description = 'Our summer trip to the coast';
  const longDescription = Array.from(
    { length: 12 },
    (_, i) => `Line ${i + 1} of a long album description`,
  ).join('\n');
  const album = await request.post(`${api}/albums`, {
    headers,
    data: {
      albumName: 'Coast trip',
      description,
      albumUsers: [{ userId, role: 'viewer' }],
    },
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
  await expect(paragraph).toHaveClass(/text-sm/);
  await highlight(page, paragraph, 'New: muted description');
  await expect(page.getByTestId('album-description-toggle')).toHaveCount(0);
  await shot(page, 'Album description shown under the title', {
    focus: paragraph,
  });

  // A long description is clamped to 3 lines with a Show more toggle
  const update = await request.patch(`${api}/albums/${albumId}`, {
    headers,
    data: { description: longDescription },
  });
  expect(update.ok()).toBeTruthy();
  await page.reload();
  const toggle = page.getByTestId('album-description-toggle');
  await expect(toggle).toHaveText('Show more');
  await expect(paragraph).toHaveClass(/line-clamp-3/);
  await highlight(page, toggle, 'New: Show more');
  await shot(page, 'Long description is clamped with Show more', {
    focus: paragraph,
  });

  await toggle.click();
  await expect(toggle).toHaveText('Show less');
  await expect(paragraph).not.toHaveClass(/line-clamp-3/);
  await expect(paragraph).toContainText('Line 12 of a long album description');
  await shot(page, 'Show more reveals the full description', {
    focus: paragraph,
  });
});
