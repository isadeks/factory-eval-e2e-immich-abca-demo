import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('search bar shows a clear button only while it has text; clicking empties and focuses the input', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/photos');

  const input = page.getByRole('combobox', { name: /search your photos/i });
  const clear = page.getByRole('button', { name: 'Clear', exact: true });

  await expect(input).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(clear).toHaveCount(0);
  await highlight(page, input, 'Empty search bar: no clear button');
  await shot(page, 'Empty search bar has no clear button', { focus: input });

  await input.fill('sunset');
  await expect(clear).toBeVisible();
  await highlight(page, clear, 'New: clear button');
  await shot(page, 'Clear button appears once there is text', { focus: input });

  // move focus away so we can verify clicking the button focuses the input
  await page.getByRole('button', { name: 'Search', exact: true }).focus();
  await expect(input).not.toBeFocused();

  await clear.click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(clear).toHaveCount(0);
  await highlight(page, input, 'Cleared and focused');
  await shot(page, 'Clicking clear empties and focuses the input', { focus: input });
});
