import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('empty archive page shows a centered, muted "Nothing archived yet" message', async ({ page }) => {
  await signIn(page);
  await page.goto('/archive');

  const state = page.getByTestId('archive-empty-state');
  await expect(state).toBeVisible();
  const message = state.getByText('Nothing archived yet');
  await expect(message).toBeVisible();

  // centered horizontally within the page
  const box = await message.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  const center = box!.x + box!.width / 2;
  expect(Math.abs(center - viewport!.width / 2)).toBeLessThan(viewport!.width / 4);

  // muted colour: not the default full-contrast text colour
  await expect(message).toHaveClass(/text-gray-500/);

  await highlight(page, message, 'New: empty state');
  await shot(page, 'Empty archive shows a muted, centered message', { focus: state });
});
