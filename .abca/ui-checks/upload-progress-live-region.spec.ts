import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('upload progress is announced through an aria-live region', async ({ page }) => {
  const assets = process.env.UI_CHECK_ASSETS!;
  await signIn(page);
  await page.goto('/photos');

  const region = page.getByTestId('upload-progress-live-region');
  await expect(region).toBeAttached();
  await expect(region).toHaveAttribute('role', 'status');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
  await expect(region).toHaveText('');

  // Record every message the region announces (the upload panel closes itself once uploads finish).
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="upload-progress-live-region"]')!;
    const seen: string[] = [];
    (window as unknown as { __announced: string[] }).__announced = seen;
    new MutationObserver(() => {
      const text = el.textContent?.trim();
      if (text && seen.at(-1) !== text) {
        seen.push(text);
      }
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Click to upload your first photo').click();
  await (await chooser).setFiles([1, 2, 3].map((n) => `${assets}/photo-${n}.jpg`));

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __announced: string[] }).__announced))
    .toContainEqual(expect.stringMatching(/Processed \d+\/3/));

  await highlight(page, region.or(page.locator('body')).first(), 'New: sr-only aria-live region');
  await shot(page, 'Upload progress is announced to screen readers');
});
