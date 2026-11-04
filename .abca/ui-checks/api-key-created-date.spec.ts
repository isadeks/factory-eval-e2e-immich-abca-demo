import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('account settings list the creation date of an API key', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const keyName = `ui-check-key-${Date.now()}`;
  const created = await request.post(`${apiUrl}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name: keyName, permissions: ['all'] },
  });
  expect(created.ok()).toBeTruthy();
  const { apiKey } = await created.json();

  const expectedDate = new Date(apiKey.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  await signIn(page);
  await page.goto('/user-settings');
  const accordion = page.getByRole('button', { name: /API Keys/ });
  await accordion.click();

  const row = page.getByRole('row', { name: new RegExp(keyName) });
  await expect(row).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible();
  await expect(row.getByRole('cell', { name: expectedDate })).toBeVisible();

  await highlight(page, row.getByRole('cell', { name: expectedDate }), 'API key creation date');
  await shot(page, 'API key row shows its creation date', { focus: row });
});
