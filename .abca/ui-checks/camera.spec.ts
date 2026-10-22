import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

test.describe('Camera', () => {
  test.beforeEach(async ({ page }) => {
    // Stand-in camera: a canvas stream, so the check does not depend on a real device or a secure context.
    await page.addInitScript(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      let frame = 0;
      setInterval(() => {
        context.fillStyle = `hsl(${(frame += 5) % 360}, 70%, 50%)`;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }, 50);
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => canvas.captureStream(20) },
      });
    });
  });

  test('takes a picture from the sidebar camera page and uploads it', async ({ page, request }) => {
    const apiUrl = process.env.PREVIEW_API_URL!;
    const login = await request.post(`${apiUrl}/auth/login`, {
      data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
    });
    const { accessToken } = await login.json();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const countAssets = async () => {
      const response = await request.post(`${apiUrl}/search/metadata`, { headers, data: { size: 100 } });
      return (await response.json()).assets.total as number;
    };
    const before = await countAssets();

    await signIn(page);

    const sidebar = page.getByRole('navigation', { name: 'Primary' });
    const sharing = sidebar.getByRole('link', { name: 'Sharing' });
    const camera = sidebar.getByRole('link', { name: 'Camera' });
    await expect(camera).toBeVisible();
    // The Camera entry sits directly below Sharing.
    const sharingBox = (await sharing.boundingBox())!;
    const cameraBox = (await camera.boundingBox())!;
    expect(cameraBox.y).toBeGreaterThan(sharingBox.y);
    await highlight(page, camera, 'New: Camera');
    await shot(page, 'Camera entry in the sidebar below Sharing', { focus: camera });

    await camera.click();
    await page.waitForURL('**/camera');
    const takePicture = page.getByRole('button', { name: 'Take picture' });
    await expect(takePicture).toBeEnabled();
    await highlight(page, takePicture, 'Take picture');
    await shot(page, 'Camera page with live preview', { focus: page.getByTestId('camera-preview') });

    await takePicture.click();
    await expect(page.getByText('Picture taken and uploaded')).toBeVisible();
    await shot(page, 'Picture uploaded confirmation');

    await expect.poll(countAssets, { timeout: 60_000 }).toBe(before + 1);
  });
});
