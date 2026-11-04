import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('favorites page shows an empty-state message when there are no favorites', async ({ page }) => {
  await signIn(page);
  await page.goto('/favorites');

  const empty = page.getByTestId('favorites-empty-state');
  await expect(empty).toBeVisible();
  await expect(empty.getByText('No favorites yet')).toBeVisible();
  await expect(empty.locator('svg')).toBeVisible();

  await highlight(page, empty, 'New: empty state');
  await shot(page, 'Favorites page shows "No favorites yet" with a heart icon', { focus: empty });
});
