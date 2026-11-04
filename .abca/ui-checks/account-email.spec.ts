import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('account settings page shows the signed-in email at the top', async ({ page }) => {
  await signIn(page);
  await page.goto('/user-settings');

  const email = page.getByTestId('account-email');
  await expect(email).toBeVisible();
  await expect(email).toHaveText(process.env.PREVIEW_ADMIN_EMAIL!);

  await highlight(page, email, 'New: account email');
  await shot(page, 'Account email shown at the top of settings', { focus: email });
});
