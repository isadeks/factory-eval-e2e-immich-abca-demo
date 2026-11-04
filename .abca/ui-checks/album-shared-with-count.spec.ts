import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('album cards show the shared-with count', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const userIds: string[] = [];
  const suffix = Date.now();
  for (const n of [1, 2]) {
    const res = await request.post(`${api}/admin/users`, {
      headers,
      data: { email: `shared-${n}-${suffix}@example.com`, name: `Shared ${n}`, password: 'password-123' },
    });
    expect(res.ok()).toBeTruthy();
    userIds.push((await res.json()).id);
  }

  const name = `Shared album ${suffix}`;
  const created = await request.post(`${api}/albums`, {
    headers,
    data: { albumName: name, albumUsers: userIds.map((userId) => ({ userId, role: 'viewer' })) },
  });
  expect(created.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/albums');

  const card = page.getByTestId('album-card').filter({ hasText: name });
  const count = card.getByTestId('album-shared-with-count');
  await expect(count).toHaveText('Shared with 2 people');
  await highlight(page, count, 'New: shared-with count');
  await shot(page, 'Album card shows how many people it is shared with', { focus: card });
});
