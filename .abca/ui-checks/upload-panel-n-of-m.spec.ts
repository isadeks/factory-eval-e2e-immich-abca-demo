import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';
import { join } from 'node:path';

test('upload panel shows "n of m uploaded" progress text', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  // Let the first two uploads through and hold the remaining two until released, so the panel stays open
  // mid-upload with a predictable count.
  let seen = 0;
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    (url) => url.pathname === '/api/assets',
    async (route) => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }
      seen++;
      if (seen > 2) {
        await released;
      }
      return route.continue();
    },
  );

  const assets = process.env.UI_CHECK_ASSETS ?? '';
  const files = [1, 2, 3, 4].map((n) => join(assets, `photo-${n}.jpg`));

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload', exact: true }).first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles(files);

  const progress = page.getByTestId('upload-n-of-m');
  await expect(progress).toHaveText('2 of 4 uploaded', { timeout: 60_000 });
  await highlight(page, progress, 'New: n of m uploaded');
  await shot(page, 'Upload panel shows "2 of 4 uploaded" mid-upload', { focus: progress });

  release();
});
