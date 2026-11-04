import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const parseHash = (hash: string) => {
  const [zoom, lat, lng] = hash.replace(/^#/, '').split('/').map(Number);
  return { zoom, lat, lng };
};

test('map restores the last zoom level and centre after a fresh visit', async ({ page }) => {
  await signIn(page);

  await page.goto('/map');
  const canvas = page.locator('canvas.maplibregl-canvas');
  await expect(canvas).toBeVisible();
  await expect(page).toHaveURL(/#[\d.]+\/-?[\d.]+\/-?[\d.]+/);

  // zoom in with the navigation control a few times
  const zoomIn = page.locator('.maplibregl-ctrl-zoom-in');
  await expect(zoomIn).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await zoomIn.click();
  }

  // wait until the view has been saved and the zoom has settled
  await expect
    .poll(async () => {
      const stored = await page.evaluate(() => localStorage.getItem('map-view'));
      if (!stored) {
        return false;
      }
      const { zoom } = parseHash(new URL(page.url()).hash);
      return Math.abs(JSON.parse(stored).zoom - zoom) < 0.05 && zoom > 3;
    })
    .toBe(true);

  const before = parseHash(new URL(page.url()).hash);
  await highlight(page, zoomIn, 'Zoomed in, view is saved');
  await shot(page, 'Map zoomed in', { focus: canvas });

  // fresh visit without a URL hash
  await page.goto('/map');
  await expect(canvas).toBeVisible();
  // the URL hash is only written on the first movement, so nudge the zoom by one level and compare with the saved view
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await expect(page).toHaveURL(/#[\d.]+\/-?[\d.]+\/-?[\d.]+/);
  await expect.poll(() => parseHash(new URL(page.url()).hash).zoom).toBeCloseTo(before.zoom + 1, 1);

  const after = parseHash(new URL(page.url()).hash);
  expect(after.lat).toBeCloseTo(before.lat, 1);
  expect(after.lng).toBeCloseTo(before.lng, 1);

  await highlight(page, canvas, 'Restored zoom and centre');
  await shot(page, 'Map reopened at the remembered zoom level', { focus: canvas });
});
