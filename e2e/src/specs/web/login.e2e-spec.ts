import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Login page', () => {
  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    await utils.adminSetup();
  });

  test('shows a Welcome back heading above the email field', async ({ page }) => {
    await page.goto('/auth/login?autoLaunch=0');

    const heading = page.getByRole('heading', { name: 'Welcome back' });
    const email = page.getByLabel('Email');
    await expect(heading).toBeVisible();
    await expect(email).toBeVisible();

    const headingBox = await heading.boundingBox();
    const emailBox = await email.boundingBox();
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(emailBox!.y);
  });
});
