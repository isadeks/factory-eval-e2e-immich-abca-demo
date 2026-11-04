import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('new API key secret modal has a Copy button that copies the key and shows Copied', async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(baseURL ?? '').origin,
  });
  await signIn(page);
  await page.goto('/user-settings?isOpen=api-keys');

  await page.getByRole('button', { name: 'New API Key' }).click();
  const create = page.getByRole('dialog');
  await create.getByText('Select all', { exact: true }).click();
  await shot(page, 'Create dialog with all permissions selected');
  await create.getByRole('button', { name: 'Create', exact: true }).click();

  const secret = page.locator('textarea[readonly]');
  await expect(secret).toBeVisible();
  const key = await secret.inputValue();
  expect(key.length).toBeGreaterThan(10);

  const copy = page.getByTestId('api-key-copy-button');
  await expect(copy).toHaveText('Copy');
  await highlight(page, copy, 'New: Copy button');
  await shot(page, 'Copy button next to the new API key', { focus: copy });

  await copy.click();
  await expect(copy).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(key);
  await highlight(page, copy, 'Now shows Copied');
  await shot(page, 'Button shows Copied after copying', { focus: copy });
});
