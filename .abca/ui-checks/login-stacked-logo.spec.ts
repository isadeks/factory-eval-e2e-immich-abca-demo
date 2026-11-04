import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

test('login page shows the stacked logo centered above the product name', async ({ page }) => {
  await page.goto('/auth/login');

  const logo = page.getByRole('img', { name: 'Immich logo' }).last();
  await expect(logo).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();

  // the stacked logo is taller than wide-ish (flower above the wordmark), unlike the square icon
  const box = (await logo.boundingBox())!;
  expect(box.height).toBeGreaterThan(150);
  const form = (await page.locator('form').boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(form.y);

  // centered horizontally in the card
  const viewport = page.viewportSize()!;
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(4);

  // the page keeps an (accessible) h1 title
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();

  await highlight(page, logo, 'New: stacked logo');
  await shot(page, 'Login page with the stacked logo above the product name', { focus: logo });
});
