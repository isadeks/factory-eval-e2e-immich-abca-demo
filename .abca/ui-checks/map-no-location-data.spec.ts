import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('map page shows "No location data" when no asset has GPS', async ({ page }) => {
  await signIn(page);
  await page.goto('/map');

  const message = page.getByTestId('map-no-location-data');
  await expect(message).toBeVisible({ timeout: 60_000 });
  await expect(message).toHaveText('No location data');

  await highlight(page, message, 'New: No location data message');
  await shot(page, 'Map page shows the No location data message', { focus: message });
});
