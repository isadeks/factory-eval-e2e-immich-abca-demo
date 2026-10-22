import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Camera', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test.beforeEach(async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.addInitScript(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const context2d = canvas.getContext('2d')!;
      setInterval(() => {
        context2d.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        context2d.fillRect(0, 0, canvas.width, canvas.height);
      }, 50);
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => canvas.captureStream(20) },
      });
    });
  });

  test('is linked in the sidebar below sharing', async ({ page }) => {
    await page.goto('/photos');
    const links = page.getByRole('navigation', { name: 'Primary' }).getByRole('link');
    const names = await links.allInnerTexts();
    const trimmed = names.map((name) => name.trim());
    expect(trimmed.indexOf('Camera')).toBe(trimmed.indexOf('Sharing') + 1);
  });

  test('uploads a picture taken with the camera', async ({ page }) => {
    await page.goto('/camera');
    const takePicture = page.getByRole('button', { name: 'Take picture' });
    await expect(takePicture).toBeEnabled();
    await takePicture.click();
    await expect(page.getByText('Picture taken and uploaded')).toBeVisible();

    await expect
      .poll(async () => {
        const { assets } = await utils.searchAssets(admin.accessToken, { size: 100 });
        return assets.items.filter((asset) => asset.originalFileName.startsWith('camera-')).length;
      })
      .toBe(1);
  });
});
