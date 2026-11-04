import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

test('Explore shows the number of people next to the People heading', async ({ page, request }) => {
  const login = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const headers = { Authorization: `Bearer ${(await login.json()).accessToken}` };

  const upload = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `explore-people-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: new Date().toISOString(),
      fileModifiedAt: new Date().toISOString(),
      assetData: {
        name: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id: assetId } = await upload.json();

  for (const name of ['Alice', 'Bob', 'Carol']) {
    const person = await request.post(`${api}/people`, { headers, data: { name } });
    expect(person.ok()).toBeTruthy();
    const face = await request.post(`${api}/faces`, {
      headers,
      data: {
        assetId,
        personId: (await person.json()).id,
        imageWidth: 1000,
        imageHeight: 1000,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      },
    });
    expect(face.ok()).toBeTruthy();
  }

  await signIn(page);
  await page.goto('/explore');

  const heading = page.getByTestId('explore-people-heading');
  await expect(heading).toContainText('People');
  const count = page.getByTestId('explore-people-count');
  await expect(count).toHaveText('(3)');

  await highlight(page, count, 'New: person count');
  await shot(page, 'Explore shows the People heading with the person count', { focus: heading });
});
