import { expect, test } from '@playwright/test';
import { mkdtempSync, truncateSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const GIB = 1024 ** 3;

test('uploading a file larger than 1 GB shows a non-blocking warning', async ({ page }) => {
  // sparse files: cheap on disk, but report the requested size to the browser
  const dir = mkdtempSync(join(tmpdir(), 'large-upload-'));
  const bigFile = join(dir, 'big-video-still.jpg');
  writeFileSync(bigFile, '');
  truncateSync(bigFile, GIB + 1024 * 1024);

  await signIn(page);
  await page.goto('/photos');

  const uploadButton = page.getByRole('button', { name: 'Upload' }).first();
  await expect(uploadButton).toBeVisible();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await uploadButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(bigFile);

  const warning = page.getByText(/big-video-still\.jpg is large/);
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('1 GiB');
  await highlight(page, warning, 'New: large file warning');
  await shot(page, 'A warning appears for the file larger than 1 GB', { focus: warning });

  // non-blocking: the file is still queued for upload
  await expect(page.getByText('big-video-still.jpg').first()).toBeVisible();
});
