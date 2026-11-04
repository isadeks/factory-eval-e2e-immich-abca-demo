import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('pressing ? shows the keyboard shortcut list on any page', async ({ page }) => {
  await signIn(page);

  // A page that has no timeline or gallery, where '?' did nothing before.
  await page.goto('/user-settings');
  await expect(page.getByText('Show keyboard shortcuts')).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await shot(page, 'User settings page before pressing ?');

  await page.keyboard.press('Shift+?');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Keyboard shortcuts')).toBeVisible();
  await expect(dialog.getByText('General')).toBeVisible();
  await expect(dialog.getByText('Actions')).toBeVisible();
  await highlight(page, dialog, 'New: shortcut list on ?');
  await shot(page, 'Pressing ? opens the keyboard shortcut list', { focus: dialog });

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Also still works on the photos timeline.
  await page.goto('/photos');
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Shift+?');
  await expect(page.getByRole('dialog').getByText('Keyboard shortcuts')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
});
