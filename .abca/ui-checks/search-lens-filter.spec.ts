import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('search filters show the lens model', async ({ page }) => {
  await signIn(page);

  // Open the search page with a lens filter applied: the chip names the lens filter.
  const lens = 'EF 50mm f/1.8 USM';
  await page.goto(`/search?query=${encodeURIComponent(JSON.stringify({ lensModel: lens }))}`);
  const chips = page.locator('#search-chips');
  await expect(chips).toContainText('Lens model');
  await expect(chips).toContainText(lens);

  // Open the search options modal: the camera section offers a Lens model filter.
  await page.getByRole('button', { name: 'Show search options' }).click();
  const camera = page.locator('#camera-selection');
  await expect(camera).toBeVisible();
  const lensInput = camera.getByRole('combobox', { name: 'Lens model' });
  await expect(lensInput).toBeVisible();
  await expect(camera.getByRole('combobox', { name: 'Make', exact: true })).toBeVisible();
  await expect(camera.getByRole('combobox', { name: 'Model', exact: true })).toBeVisible();

  await highlight(page, camera, 'Camera filters incl. Lens model');
  await shot(page, 'Search options show the lens model filter', { focus: camera });
});
