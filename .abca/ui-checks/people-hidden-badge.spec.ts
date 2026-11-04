import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

test('manage people view marks hidden people with a Hidden badge', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const upload = await request.post(`${apiUrl}/assets`, {
    headers,
    multipart: {
      assetData: { name: 'photo-1.jpg', mimeType: 'image/jpeg', buffer: readFileSync(`${process.env.UI_CHECK_ASSETS}/photo-1.jpg`) },
      deviceAssetId: `hidden-badge-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: new Date().toISOString(),
      fileModifiedAt: new Date().toISOString(),
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id: assetId } = await upload.json();

  for (const [name, isHidden] of [
    ['Visible Vera', false],
    ['Hidden Hank', true],
  ] as const) {
    const res = await request.post(`${apiUrl}/people`, { headers, data: { name, isHidden } });
    expect(res.ok()).toBeTruthy();
    const { id: personId } = await res.json();
    const face = await request.post(`${apiUrl}/faces`, {
      headers,
      data: { assetId, personId, imageWidth: 100, imageHeight: 100, x: 10, y: 10, width: 40, height: 40 },
    });
    expect(face.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/people/manage');

  const hiddenCard = page.getByRole('button', { name: 'Hide person Hidden Hank' });
  const visibleCard = page.getByRole('button', { name: 'Hide person Visible Vera' });
  await expect(hiddenCard).toBeVisible();
  await expect(visibleCard).toBeVisible();

  const badge = hiddenCard.getByTestId('hidden-badge');
  await expect(badge).toHaveText('Hidden');
  await expect(visibleCard.getByTestId('hidden-badge')).toHaveCount(0);

  await highlight(page, badge, 'New: Hidden badge');
  await shot(page, 'Hidden person has a Hidden badge', { focus: hiddenCard });

  await visibleCard.click();
  await expect(visibleCard.getByTestId('hidden-badge')).toHaveText('Hidden');
  await highlight(page, visibleCard.getByTestId('hidden-badge'), 'Badge after toggling');
  await shot(page, 'Toggling a person to hidden shows the badge', { focus: visibleCard });
});
