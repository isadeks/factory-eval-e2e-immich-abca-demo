import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

// DEM-203 follow-up: the top navigation bar has a "Send feedback" button that opens the issue/feedback page.
test('navigation bar has a send feedback button linking to the feedback page', async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/photos/);

  const feedback = page.locator('#feedback-button');
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveAttribute('aria-label', 'Send feedback');
  await expect(feedback).toHaveAttribute('href', 'https://github.com/immich-app/immich/issues/new/choose');
  await expect(feedback).toHaveAttribute('target', '_blank');

  await highlight(page, feedback, 'New: Send feedback button');
  await shot(page, 'Top bar shows the new Send feedback button', { focus: feedback });
});
