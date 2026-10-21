import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('camera page in the sidebar takes a picture and uploads it', async ({ page, context, request }) => {
  await context.grantPermissions(['camera']);
  // Headless CI has no webcam: provide a synthetic video stream instead of the real device.
  await context.addInitScript(() => {
    const getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      let frame = 0;
      const draw = () => {
        ctx.fillStyle = `hsl(${(frame * 3) % 360}, 70%, 45%)`;
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.fillText('Fake camera', 180, 250);
        frame++;
      };
      draw();
      setInterval(draw, 100);
      return canvas.captureStream(15);
    };
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
  });

  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const countImages = async () => {
    const response = await request.get(`${apiUrl}/assets/statistics`, { headers });
    return ((await response.json()) as { images: number }).images;
  };
  const before = await countImages();

  await signIn(page);
  await page.goto('/photos');

  const sidebar = page.getByRole('navigation', { name: 'Primary' });
  const sharing = sidebar.getByRole('link', { name: 'Sharing' });
  const cameraLink = sidebar.getByRole('link', { name: 'Camera' });
  await expect(cameraLink).toBeVisible();

  // Camera sits directly below "Sharing" in the sidebar.
  const sharingBox = (await sharing.boundingBox())!;
  const cameraBox = (await cameraLink.boundingBox())!;
  expect(cameraBox.y).toBeGreaterThan(sharingBox.y);
  expect(cameraBox.y - sharingBox.y).toBeLessThan(80);

  await highlight(page, cameraLink, 'New: Camera in the sidebar');
  await shot(page, 'Camera entry below Sharing in the sidebar', { focus: sidebar });

  await cameraLink.click();
  await expect(page).toHaveURL(/\/camera$/);

  const capture = page.getByTestId('camera-capture-button');
  await expect(capture).toBeEnabled({ timeout: 30_000 });
  await highlight(page, page.getByTestId('camera-preview'), 'Live camera preview');
  await shot(page, 'Camera page shows the live preview', { focus: page.getByTestId('camera-preview') });

  await capture.click();
  await expect.poll(countImages, { timeout: 60_000 }).toBe(before + 1);

  await expect(page.getByText('Photo uploaded')).toBeVisible();
  await highlight(page, capture, 'Picture captured and uploaded');
  await shot(page, 'Picture was uploaded', { focus: capture });
});
