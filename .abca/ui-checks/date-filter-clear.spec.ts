import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('date filter has a clear button that resets both dates', async ({ page }) => {
  await signIn(page);

  const query = JSON.stringify({ takenAfter: '2024-01-01T00:00:00.000Z', takenBefore: '2024-02-01T23:59:59.999Z' });
  await page.goto(`/search?query=${encodeURIComponent(query)}`);

  await page.getByRole('button', { name: 'Show search options' }).click();
  const dialog = page.getByRole('dialog');
  const dateRange = dialog.locator('#date-range-selection');
  await expect(dateRange).toBeVisible();

  const clear = dialog.getByTestId('clear-date-filter');
  await expect(clear).toBeVisible();
  await highlight(page, clear, 'New: clear dates button');
  await shot(page, 'Date filter shows a Clear button when dates are set', { focus: dateRange });

  await clear.click();

  await expect(clear).toBeHidden();
  await highlight(page, dateRange, 'Dates cleared');
  await shot(page, 'After clicking Clear the dates are reset and the button is gone', { focus: dateRange });
});
