import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const YELLOW = 'rgb(255, 235, 59)';

test('app background is yellow', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.locator('body')).toHaveCSS('background-color', YELLOW);
  await shot(page, 'Login page has a yellow background');

  await signIn(page);
  await page.goto('/user-settings');
  await expect(page.locator('body')).toHaveCSS('background-color', YELLOW);
  await expect(page.locator('main')).toBeVisible();
  await highlight(page, page.locator('main'), 'Page area on yellow background');
  await shot(page, 'Signed-in page keeps the yellow background');
});
