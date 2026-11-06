import { expect, test } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

test('login page shows the server version in small grey text at the bottom of the card', async ({
  page,
  request,
}) => {
  const res = await request.get(
    `${process.env.PREVIEW_API_URL}/server/version`,
  );
  expect(res.ok()).toBeTruthy();
  const { major, minor, patch } = await res.json();

  await page.goto('/auth/login?autoLaunch=0');

  const version = page.locator('#login-server-version');
  await expect(version).toBeVisible();
  await expect(version).toHaveText(
    new RegExp(`^v${major}\\.${minor}\\.${patch}`),
  );
  await expect(version).toHaveCSS('font-size', '12px');
  await expect(version).toHaveCSS('text-align', 'center');

  const [r, g, b] = await version.evaluate((el) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = getComputedStyle(el).color;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(40);

  // below the sign-in button
  const button = (await page
    .getByRole('button', { name: 'Login' })
    .boundingBox())!;
  const v = (await version.boundingBox())!;
  expect(button.y + button.height).toBeLessThanOrEqual(v.y);

  await highlight(page, version, 'New: server version');
  await shot(page, 'Login page shows the version at the bottom of the card', {
    focus: page.locator('section'),
  });
});
