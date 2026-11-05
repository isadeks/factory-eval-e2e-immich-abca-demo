import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

test('login page shows a centred Welcome back heading above the email field', async ({ page }) => {
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
  expect(Math.abs(h.x + h.width / 2 - (card.x + card.width / 2))).toBeLessThan(2);
  await expect(heading).toHaveCSS('text-align', 'center');

  // bold
  await expect(heading).toHaveCSS('font-weight', '700');

  // same font as the page title
  const fontOf = (l: typeof heading) => l.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await fontOf(heading)).toBe(await fontOf(title));

  await highlight(page, heading, 'New: Welcome back heading');
  await shot(page, 'Login page shows Welcome back above the email field', { focus: page.locator('form') });
});
