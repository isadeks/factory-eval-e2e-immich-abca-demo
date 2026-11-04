import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

const login = async (request: APIRequestContext) => {
  const response = await request.post(`${api}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  const { accessToken } = await response.json();
  return { Authorization: `Bearer ${accessToken}` };
};

const upload = async (request: APIRequestContext, headers: Record<string, string>, name: string) => {
  const now = new Date().toISOString();
  const response = await request.post(`${api}/assets`, {
    headers,
    multipart: {
      assetData: { name, mimeType: 'image/jpeg', buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)) },
      deviceAssetId: `people-photo-count-${name}-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).id as string;
};

test('people page shows how many photos each person appears in', async ({ page, request }) => {
  const headers = await login(request);

  const createPerson = async (name: string) => {
    const response = await request.post(`${api}/people`, { headers, data: { name } });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).id as string;
  };
  const addFace = async (assetId: string, personId: string, x: number) => {
    const response = await request.post(`${api}/faces`, {
      headers,
      data: { assetId, personId, imageWidth: 1000, imageHeight: 1000, x, y: 100, width: 100, height: 100 },
    });
    expect(response.ok()).toBeTruthy();
  };

  const [asset1, asset2, asset3] = [
    await upload(request, headers, 'photo-1.jpg'),
    await upload(request, headers, 'photo-2.jpg'),
    await upload(request, headers, 'photo-3.jpg'),
  ];
  const alice = await createPerson('Alice Count');
  const bob = await createPerson('Bob Count');

  // Alice: three photos, two faces in the first one (must still count as three photos).
  await addFace(asset1, alice, 100);
  await addFace(asset1, alice, 400);
  await addFace(asset2, alice, 100);
  await addFace(asset3, alice, 100);
  // Bob: one photo.
  await addFace(asset1, bob, 700);

  await signIn(page);
  await page.goto('/people');

  // People are ordered by photo count, so Alice (3 photos) comes before Bob (1 photo).
  await expect(page.locator('#people-card')).toHaveCount(2);
  const counts = page.getByTestId('person-photo-count');
  const aliceCount = counts.nth(0);
  const bobCount = counts.nth(1);

  await expect(aliceCount).toHaveText('3 photos');
  await expect(bobCount).toHaveText('1 photo');

  await highlight(page, aliceCount, 'New: 3 photos');
  await shot(page, 'Alice appears in 3 photos', { focus: page.locator('#people-card').nth(0) });
  await highlight(page, bobCount, 'New: 1 photo');
  await shot(page, 'Bob appears in 1 photo', { focus: page.locator('#people-card').nth(1) });
});
