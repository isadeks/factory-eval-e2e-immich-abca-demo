import { expect, test } from '@playwright/test';
import { shot, signIn } from './feval-annotate';

// DEM-203 only changes README.md (adds a Contributors link to its navigation list), which the app does not render.
// This check confirms the preview built from the PR still serves the app and lets the admin sign in.
test('preview from the README-only change serves the app and signs in', async ({ page }) => {
  const ping = await page.request.get(`${process.env.PREVIEW_API_URL}/server/ping`);
  expect(ping.ok()).toBe(true);

  await signIn(page);
  await expect(page).toHaveURL(/\/photos/);
  await shot(page, 'Signed-in app after the README-only change');
});
