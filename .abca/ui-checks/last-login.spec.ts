import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('account settings show the last login time', async ({ page }) => {
  await signIn(page);
  await page.goto('/user-settings');

  const accordion = page.getByRole('button', { name: /^Account/ }).first();
  await accordion.click();

  const lastLogin = page.getByTestId('last-login');
  await expect(lastLogin).toBeVisible();
  await expect(lastLogin.getByText('Last login')).toBeVisible();
  await expect(lastLogin.locator('input')).toHaveValue(/\d{4}/);

  await highlight(page, lastLogin, 'New: Last login');
  await shot(page, 'Account settings show the last login time', { focus: lastLogin });
});
