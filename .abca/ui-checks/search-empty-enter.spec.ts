import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('pressing Enter on an empty or blank search query does not navigate', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  const input = page.getByRole('combobox', { name: /search/i });
  await expect(input).toBeVisible();
  const startUrl = page.url();

  await input.click();
  await input.press('Enter');
  await expect(page).toHaveURL(startUrl);
  await highlight(page, input, 'Enter on empty query: no navigation');
  await shot(page, 'Empty search stays on the photos page', { focus: input });

  await input.fill('   ');
  await input.press('Enter');
  await expect(page).toHaveURL(startUrl);
  await shot(page, 'Whitespace-only search stays on the photos page', { focus: input });

  await input.fill('beach');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/search\?/);
  await shot(page, 'A real query navigates to search results');
});
