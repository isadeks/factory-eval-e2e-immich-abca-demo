import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

// tailwind purple-200 (light theme) and purple-900 (dark theme), allowing for color-space rounding
const PURPLE_LIGHT = [233, 213, 255];
const PURPLE_DARK = [88, 28, 135];
const isCloseTo = (actual: number[], expected: number[]) =>
  actual.every((c, i) => Math.abs(c - expected[i]) <= 8);

// computed colors may be lab()/oklch(); rasterize one pixel to read it back as sRGB
const bodyBackground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const context = document.createElement('canvas').getContext('2d')!;
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  });

test('page background is purple in dark and light themes', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  const body = page.locator('body');
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await expect
    .poll(async () => isCloseTo(await bodyBackground(page), PURPLE_DARK))
    .toBe(true);
  await highlight(page, body, 'New: purple background (dark)');
  await shot(page, 'Dark theme page background is purple');

  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await expect
    .poll(async () => isCloseTo(await bodyBackground(page), PURPLE_LIGHT))
    .toBe(true);
  await highlight(page, body, 'New: purple background (light)');
  await shot(page, 'Light theme page background is purple');
});
