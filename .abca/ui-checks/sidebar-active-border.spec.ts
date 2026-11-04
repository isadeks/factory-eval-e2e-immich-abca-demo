import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test('sidebar highlights the active section with a 3px primary left border', async ({ page }) => {
  await signIn(page);
  await page.goto('/photos');

  const sidebar = page.getByRole('navigation', { name: 'Primary' });
  const active = sidebar.locator('a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toContainText('Photos');
  await expect(active).toHaveCSS('border-left-width', '3px');
  await expect(active).toHaveCSS('border-left-style', 'solid');

  const primary = await active.evaluate((el) => {
    const probe = document.createElement('div');
    probe.className = 'text-primary';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(active).toHaveCSS('border-left-color', primary);

  await highlight(page, active, 'New: 3px primary left border');
  await shot(page, 'Photos is active and has a left border', { focus: active });

  await sidebar.getByRole('link', { name: 'Explore' }).click();
  await expect(page).toHaveURL(/\/explore/);
  const explore = sidebar.locator('a[aria-current="page"]');
  await expect(explore).toContainText('Explore');
  await expect(explore).toHaveCSS('border-left-width', '3px');
  await expect(sidebar.getByRole('link', { name: 'Photos' })).toHaveCSS('border-left-width', '0px');

  await highlight(page, explore, 'Border moves to the active section');
  await shot(page, 'Explore is active; Photos no longer has the border', { focus: explore });
});
