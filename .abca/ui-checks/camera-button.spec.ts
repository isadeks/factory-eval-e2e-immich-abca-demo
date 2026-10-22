import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

// Use Chromium's built-in fake webcam so the test can really open the camera and snap a picture.
test.use({
  permissions: ['camera'],
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  },
});

test('sidebar Camera button uploads the captured picture immediately', async ({
  page,
  request,
}) => {
  const login = await request.post(`${API}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const count = async () => {
    const response = await request.post(`${API}/search/metadata`, {
      headers,
      data: { size: 100 },
    });
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

  // Clicking the button opens a live camera viewfinder
  await camera.click();
  const video = page.getByTestId('camera-video');
  await expect(video).toBeVisible();
  const capture = page.getByTestId('camera-capture');
  await expect(capture).toBeEnabled({ timeout: 30_000 });
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.videoWidth),
    )
    .toBeGreaterThan(0);
  await highlight(page, capture, 'Snap the picture');
  await shot(page, 'Camera viewfinder with the Take picture button', {
    focus: capture,
  });

  // Snapping the picture uploads it right away, no extra confirmation
  await capture.click();
  await expect(video).toBeHidden();

  await expect.poll(count, { timeout: 60_000 }).toBe(before + 1);

  await expect(page.locator('main img').first()).toBeVisible({
    timeout: 60_000,
  });
  await shot(page, 'Picture uploaded and shown in the timeline');
});
