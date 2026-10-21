import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const GREEN = 'rgb(34, 197, 94)';

test('app background is green', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.locator('body')).toHaveCSS('background-color', GREEN);
  await expect(page.locator('html')).toHaveCSS('background-color', GREEN);
  await highlight(page, page.locator('main, body').first(), 'New: green background');
  await shot(page, 'Login page has a green background');

  await signIn(page);
  await expect(page.locator('body')).toHaveCSS('background-color', GREEN);
  await shot(page, 'Photos page has a green background');
});
