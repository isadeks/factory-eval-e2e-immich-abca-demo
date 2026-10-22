import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const ASSETS = process.env.UI_CHECK_ASSETS!;

test('sidebar Camera button uploads the captured picture immediately', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const count = async () => {
    const response = await request.post(`${API}/search/metadata`, { headers, data: { size: 100 } });
    return (await response.json()).assets.total as number;
  };
  const before = await count();

  await signIn(page);
  await page.goto('/photos');

  const sidebar = page.getByRole('navigation', { name: /primary/i });
  const camera = sidebar.getByTestId('camera-button');
  await expect(camera).toBeVisible();
  await expect(camera).toHaveText(/Camera/);
  await highlight(page, camera, 'New: Camera button');
  await shot(page, 'Camera button in the sidebar', { focus: camera });

  // The hidden input asks the device camera for a picture; feed it a photo like the camera would.
  const input = sidebar.getByTestId('camera-input');
  await expect(input).toHaveAttribute('capture', /.*/);
  await input.setInputFiles(`${ASSETS}/photo-1.jpg`);

  await expect.poll(count, { timeout: 60_000 }).toBe(before + 1);

  await expect(page.locator('main img').first()).toBeVisible({ timeout: 60_000 });
  await shot(page, 'Picture uploaded and shown in the timeline');
});
