import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

const login = async (email: string, password: string) => {
  const res = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok).toBeTruthy();
  const { accessToken } = await res.json();
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
};

test('sharing page shows who shared each album', async ({ page }) => {
  const admin = await login(process.env.PREVIEW_ADMIN_EMAIL!, process.env.PREVIEW_ADMIN_PASSWORD!);
  const suffix = Date.now();
  const aliceEmail = `alice-${suffix}@example.com`;

  const created = await fetch(`${api}/admin/users`, {
    method: 'POST',
    headers: admin,
    body: JSON.stringify({ email: aliceEmail, password: 'alice-password', name: 'Alice Sharer' }),
  });
  expect(created.ok).toBeTruthy();

  const adminUser = await (await fetch(`${api}/users/me`, { headers: admin })).json();
  const alice = await login(aliceEmail, 'alice-password');
  const aliceUser = await (await fetch(`${api}/users/me`, { headers: alice })).json();

  const theirAlbum = await fetch(`${api}/albums`, {
    method: 'POST',
    headers: alice,
    body: JSON.stringify({ albumName: 'Alice Trip', albumUsers: [{ userId: adminUser.id, role: 'editor' }] }),
  });
  expect(theirAlbum.ok).toBeTruthy();

  const myAlbum = await fetch(`${api}/albums`, {
    method: 'POST',
    headers: admin,
    body: JSON.stringify({ albumName: 'My Shared Album', albumUsers: [{ userId: aliceUser.id, role: 'viewer' }] }),
  });
  expect(myAlbum.ok).toBeTruthy();

  await signIn(page);
  await page.goto('/sharing');

  const cards = page.getByTestId('album-card');
  const aliceCard = cards.filter({ hasText: 'Alice Trip' });
  const mineCard = cards.filter({ hasText: 'My Shared Album' });

  const sharedBy = aliceCard.getByTestId('album-shared-by');
  await expect(sharedBy).toHaveText('Shared by Alice Sharer');
  await expect(mineCard.getByTestId('album-shared-by')).toHaveText('Shared by you');

  await highlight(page, sharedBy, 'New: Shared by Alice Sharer');
  await shot(page, 'Album shared with me shows who shared it', { focus: aliceCard });

  const mineSharedBy = mineCard.getByTestId('album-shared-by');
  await highlight(page, mineSharedBy, 'New: Shared by you');
  await shot(page, 'My own shared album shows Shared by you', { focus: mineCard });
});
