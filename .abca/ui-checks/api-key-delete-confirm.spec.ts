import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('deleting an API key asks for confirmation first', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const keyName = `ui-check-key-${Date.now()}`;
  const created = await request.post(`${API}/api-keys`, { headers, data: { name: keyName, permissions: ['all'] } });
  expect(created.ok()).toBeTruthy();

  await signIn(page);
  await page.goto('/user-settings?isOpen=api-keys');

  const row = page.getByRole('row').filter({ hasText: keyName });
  await expect(row).toBeVisible();

  // Cancelling keeps the key.
  await row.getByRole('button', { name: 'Delete key' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Are you sure you want to delete this API key?');
  await highlight(page, dialog, 'New: confirmation before deleting');
  await shot(page, 'Deleting an API key asks for confirmation', { focus: dialog });

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(row).toBeVisible();
  const afterCancel = await (await request.get(`${API}/api-keys`, { headers })).json();
  expect(afterCancel.some((k: { name: string }) => k.name === keyName)).toBe(true);
  await shot(page, 'Cancelling keeps the API key', { focus: row });

  // Confirming deletes it.
  await row.getByRole('button', { name: 'Delete key' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(row).toBeHidden();
  const afterConfirm = await (await request.get(`${API}/api-keys`, { headers })).json();
  expect(afterConfirm.some((k: { name: string }) => k.name === keyName)).toBe(false);
  await shot(page, 'Confirming removes the API key');
});
