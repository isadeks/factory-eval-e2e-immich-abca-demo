import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('search with no matches echoes the query in the empty state', async ({ page }) => {
  await signIn(page);

  const query = 'zzz-no-such-thing';
  await page.goto(`/search?query=${encodeURIComponent(JSON.stringify({ query }))}`);

  const message = page.getByTestId('search-no-results');
  await expect(message).toBeVisible({ timeout: 30_000 });
  await expect(message).toHaveText(`No results for "${query}"`);

  await highlight(page, message, 'New: query echoed');
  await shot(page, 'Empty search shows the query that was searched', { focus: message });
});
