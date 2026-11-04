import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

// Resolve a CSS colour (any syntax Chromium understands) to sRGB channels through a canvas.
async function primaryRgb(page: import('@playwright/test').Page, variable: string) {
  return page.evaluate((v) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${v})`;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = resolved;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  }, variable);
}

test('primary theme colour is purple', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');
  const nav = page.getByRole('navigation').first();
  await expect(nav).toBeVisible();

  const light = await primaryRgb(page, '--immich-ui-primary-500');
  // purple: red and blue dominate green, blue stays above red-ish range
  expect(light.g).toBeLessThan(light.r);
  expect(light.g).toBeLessThan(light.b);
  expect(light.r).toBeGreaterThan(80);
  expect(light.b).toBeGreaterThan(150);

  await highlight(page, nav, 'Purple primary colour');
  await shot(page, 'Light mode uses the purple primary colour', { focus: nav });

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.evaluate(() => document.documentElement.classList.remove('light'));
  await expect(page.locator('html')).toHaveClass(/dark/);
  const dark = await primaryRgb(page, '--immich-ui-primary-500');
  expect(dark.g).toBeLessThan(dark.r);
  expect(dark.g).toBeLessThan(dark.b);
  await shot(page, 'Dark mode uses a lighter purple');
});
