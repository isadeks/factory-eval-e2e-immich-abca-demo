import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

test('failed upload shows the file name in the error toast', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  // Make the asset upload endpoint fail (the bulk-upload-check call is a different path and is left alone).
  await page.route(
    (url) => url.pathname === '/api/assets',
    (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom' }) })
        : route.continue(),
  );

  const fileName = 'photo-1.jpg';
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload', exact: true }).first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles(join(process.env.UI_CHECK_ASSETS ?? '', fileName));

  const toast = page.getByText(`${fileName}: Unable to upload file`);
  await expect(toast).toBeVisible({ timeout: 30_000 });

  await highlight(page, toast, 'New: file name in error toast');
  await shot(page, 'Error toast names the file that failed to upload', { focus: toast });
});
