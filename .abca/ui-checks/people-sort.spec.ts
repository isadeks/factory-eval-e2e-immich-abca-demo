import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

const login = async (request: APIRequestContext) => {
  const response = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  const { accessToken } = await response.json();
  return { Authorization: `Bearer ${accessToken}` };
};

test('People page lists named people alphabetically (case-insensitive) with unnamed people last', async ({
  page,
  request,
}) => {
  const headers = await login(request);

  const upload = async (file: string) => {
    const now = new Date().toISOString();
    const response = await request.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `people-sort-${file}-${Date.now()}`,
        deviceId: 'people-sort-check',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: {
          name: file,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, file)),
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).id as string;
  };

  const assetId = await upload('photo-1.jpg');

  const addPerson = async (name: string, faces: number) => {
    const response = await request.post(`${API}/people`, { headers, data: { name } });
    expect(response.ok()).toBeTruthy();
    const { id } = await response.json();
    for (let i = 0; i < faces; i++) {
      const face = await request.post(`${API}/faces`, {
        headers,
        data: { assetId, personId: id, imageWidth: 1000, imageHeight: 1000, x: 10, y: 10, width: 100, height: 100 },
      });
      expect(face.ok()).toBeTruthy();
    }
  };

  // created in an order that is neither alphabetical nor by case
  await addPerson('charlie', 1);
  await addPerson('', 3);
  await addPerson('Alice', 2);
  await addPerson('Dave', 1);
  await addPerson('bob', 1);

  await signIn(page);
  await page.goto('/people');

  const nameInputs = page.getByPlaceholder(/add a name/i);
  await expect(nameInputs).toHaveCount(5);

  const expected = ['Alice', 'bob', 'charlie', 'Dave', ''];
  for (const [index, value] of expected.entries()) {
    await expect(nameInputs.nth(index)).toHaveValue(value);
  }

  await highlight(page, nameInputs.first(), 'Alice first');
  await highlight(page, nameInputs.nth(4), 'Unnamed last');
  await shot(page, 'Named people are alphabetical, unnamed person is last', { focus: page.locator('div.grid.w-full').first() });
});
