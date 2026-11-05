import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

test('login page shows a grey forgot-password hint directly under the sign-in button', async ({
  page,
}) => {
  await page.goto('/auth/login?autoLaunch=0');

  const button = page.getByRole('button', { name: 'Login' });
  const hint = page.getByText('Forgot your password? Ask your admin.');

  await expect(button).toBeVisible();
  await expect(hint).toBeVisible();

  // directly below the button
  const b = (await button.boundingBox())!;
  const h = (await hint.boundingBox())!;
  expect(h.y).toBeGreaterThanOrEqual(b.y + b.height);
  expect(h.y - (b.y + b.height)).toBeLessThan(40);

  // small and grey
  await expect(hint).toHaveCSS('font-size', '12px');
  const [r, g, bl] = await hint.evaluate((el) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = getComputedStyle(el).color;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });
  expect(Math.max(r, g, bl) - Math.min(r, g, bl)).toBeLessThan(40);
  expect(r).toBeGreaterThan(80);
  expect(r).toBeLessThan(200);

  await highlight(page, hint, 'New: forgot password hint');
  await shot(page, 'Login page shows the hint under the Login button', {
    focus: page.locator('form'),
  });
});
