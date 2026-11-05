import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

test('login page shows a centred Welcome back heading above the email field', async ({
  page,
}) => {
  await page.goto('/auth/login?autoLaunch=0');

  const title = page.locator('h1');
  const heading = page.getByRole('heading', { name: 'Welcome back' });
  const email = page.getByLabel('Email');

  await expect(heading).toBeVisible();
  await expect(email).toBeVisible();

  // directly above the email field
  const h = (await heading.boundingBox())!;
  const e = (await email.boundingBox())!;
  expect(h.y + h.height).toBeLessThanOrEqual(e.y);

  // centred within the card
  const card = (await page.locator('form').boundingBox())!;
  expect(Math.abs(h.x + h.width / 2 - (card.x + card.width / 2))).toBeLessThan(
    2,
  );
  await expect(heading).toHaveCSS('text-align', 'center');

  // bold
  await expect(heading).toHaveCSS('font-weight', '700');

  // same font as the page title
  const fontOf = (l: typeof heading) =>
    l.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await fontOf(heading)).toBe(await fontOf(title));

  // grey subtitle between the heading and the email field
  const subtitle = page.getByText('Sign in to your account');
  await expect(subtitle).toBeVisible();
  const s = (await subtitle.boundingBox())!;
  expect(h.y + h.height).toBeLessThanOrEqual(s.y);
  expect(s.y + s.height).toBeLessThanOrEqual(e.y);
  await expect(subtitle).toHaveCSS('text-align', 'center');
  await expect(subtitle).toHaveCSS('font-size', '12px');
  // computed colour may be oklch(); rasterise it to RGB through a canvas
  const [r, g, b] = await subtitle.evaluate((el) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = getComputedStyle(el).color;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(40); // grey, not coloured
  expect(r).toBeGreaterThan(80);
  expect(r).toBeLessThan(200);

  await highlight(page, heading, 'New: Welcome back heading');
  await shot(page, 'Login page shows Welcome back above the email field', {
    focus: page.locator('form'),
  });
});
