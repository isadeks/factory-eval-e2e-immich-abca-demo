import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('user settings page shows the server version in the footer', async ({ page, request }) => {
  const res = await request.get(`${process.env.PREVIEW_API_URL}/server/version`);
  expect(res.ok()).toBeTruthy();
  const { major, minor, patch } = await res.json();

  await signIn(page);
  await page.goto('/user-settings');

  const footer = page.getByTestId('settings-footer-version');
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer).toContainText(`v${major}.${minor}.${patch}`);

  await highlight(page, footer, 'New: server version footer');
  await shot(page, 'Settings page footer shows the server version', { focus: footer });
});
