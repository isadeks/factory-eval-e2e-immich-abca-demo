import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('recent searches highlight the part matching what is typed', async ({ page }) => {
  await signIn(page);

  const input = page.locator('#main-search-bar');
  await input.fill('Sunset at the Beach');
  await input.press('Enter');
  await page.waitForURL(/\/search/);

  // Type a fragment: the stored term should show with that fragment highlighted.
  await input.fill('beach');
  const option = page.getByRole('option', { name: 'Sunset at the Beach' });
  await expect(option).toBeVisible();

  const marks = option.locator('mark');
  await expect(marks).toHaveCount(1);
  await expect(marks).toHaveText('Beach');
  await expect(option.getByTestId('recent-search-term')).toHaveText('Sunset at the Beach');

  await highlight(page, marks, 'New: matching word highlighted');
  await shot(page, 'Recent search with the matching word highlighted', { focus: option });

  // An empty query shows the terms without any highlight.
  await input.fill('');
  await expect(option).toBeVisible();
  await expect(option.locator('mark')).toHaveCount(0);
  await shot(page, 'No highlight without a query', { focus: option });
});
