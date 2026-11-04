import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('empty timeline shows the drag-and-drop upload hint', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  const placeholder = page.getByText('Click to upload your first photo');
  await expect(placeholder).toBeVisible();

  const hint = page.getByTestId('empty-timeline-drag-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText('Drag photos here to upload');

  await highlight(page, hint, 'New: drag hint');
  await shot(page, 'Empty timeline shows the drag photos hint', { focus: hint });
});
