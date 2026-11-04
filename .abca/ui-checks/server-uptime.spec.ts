import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('admin server status page shows the server uptime', async ({
  page,
  request,
}) => {
  const apiUrl = process.env.PREVIEW_API_URL!;
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const uptime = await request.get(`${apiUrl}/server/uptime`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(uptime.ok()).toBeTruthy();
  expect(typeof (await uptime.json()).uptimeSeconds).toBe('number');

  await signIn(page);
  await page.goto('/admin/server-status');

  const card = page.getByTestId('server-uptime');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Server uptime');
  // a freshly started server has been up for under a few minutes, e.g. "42 sec" or "1 min, 5 sec"
  await expect(page.getByTestId('server-uptime-value')).toHaveText(
    /\d+\s*(sec|min|hr|days?)/,
  );

  await highlight(page, card, 'New: Server uptime');
  await shot(page, 'Server stats page shows the server uptime', {
    focus: card,
  });
});
