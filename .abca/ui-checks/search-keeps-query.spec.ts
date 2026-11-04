import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('search input keeps the last query after navigating back', async ({ page }) => {
  await signIn(page);

  const query = encodeURIComponent(JSON.stringify({ originalFileName: 'holiday.jpg' }));
  await page.goto(`/search?query=${query}`);

  const input = page.locator('#main-search-bar');
  await expect(input).toHaveValue('holiday.jpg');
  await highlight(page, input, 'Search input shows the query');
  await shot(page, 'Search results page shows the query in the input', { focus: input });

  await page.goto('/explore');
  await expect(page).toHaveURL(/\/explore/);

  await page.goBack();
  await expect(page).toHaveURL(/\/search/);
  await expect(input).toHaveValue('holiday.jpg');
  await highlight(page, input, 'Query is still in the input');
  await shot(page, 'After browser back the query is still in the input', { focus: input });
});
