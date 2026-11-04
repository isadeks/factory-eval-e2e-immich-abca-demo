import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

async function adminHeaders(request: APIRequestContext) {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { accessToken } = await res.json();
  return { Authorization: `Bearer ${accessToken}` };
}

async function uploadAsset(request: APIRequestContext, headers: Record<string, string>, n: number) {
  const now = new Date().toISOString();
  const res = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `people-page-${n}-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: `photo-${n}.jpg`,
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`)),
      },
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id as string;
}

async function createPerson(request: APIRequestContext, headers: Record<string, string>, name: string) {
  const res = await request.post(`${API}/people`, { headers, data: { name } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id as string;
}

async function addFace(request: APIRequestContext, headers: Record<string, string>, assetId: string, personId: string) {
  const res = await request.post(`${API}/faces`, {
    headers,
    data: { assetId, personId, imageWidth: 100, imageHeight: 100, x: 10, y: 10, width: 40, height: 40 },
  });
  expect(res.ok()).toBeTruthy();
}

test('people page separates named from unnamed people and shows photo counts', async ({ page, request }) => {
  const headers = await adminHeaders(request);

  const assets: string[] = [];
  for (const n of [1, 2, 3]) {
    assets.push(await uploadAsset(request, headers, n));
  }

  const alice = await createPerson(request, headers, 'Alice Counted');
  const unnamed = await createPerson(request, headers, '');
  await addFace(request, headers, assets[0], alice);
  await addFace(request, headers, assets[1], alice);
  for (const assetId of assets) {
    await addFace(request, headers, assetId, unnamed);
  }

  // wait until the API lists both (faces are visible once the assets are on the timeline)
  await expect
    .poll(async () => {
      const res = await request.get(`${API}/people`, { headers });
      const body = await res.json();
      const counts = Object.fromEntries(body.people.map((p: { id: string; assetCount?: number }) => [p.id, p.assetCount]));
      return [counts[alice], counts[unnamed]];
    })
    .toEqual([2, 3]);

  await signIn(page);
  await page.goto('/people');

  const named = page.getByTestId('named-people');
  const unnamedSection = page.getByTestId('unnamed-people');

  await expect(named.getByRole('heading', { name: 'Named people' })).toBeVisible();
  await expect(unnamedSection.getByRole('heading', { name: 'Unnamed people' })).toBeVisible();

  // the unnamed group starts collapsed; expanding it reveals the cards
  const toggle = unnamedSection.getByTestId('unnamed-people-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(unnamedSection.getByTestId('person-asset-count')).toHaveCount(0);
  await expect(named.getByTestId('person-asset-count')).toHaveText('2 assets');
  await shot(page, 'Unnamed people start collapsed', { focus: unnamedSection });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  // Alice is in the named section, the person without a name is not
  await expect(named.locator('input[type="text"]').first()).toHaveValue('Alice Counted');
  await expect(unnamedSection.locator('input[type="text"]').first()).toHaveValue('');
  await expect(unnamedSection.locator('input[value="Alice Counted"]')).toHaveCount(0);

  // each person shows how many photos they appear in
  const aliceCard = named.locator('input[type="text"]').first().locator('xpath=..');
  await expect(aliceCard.getByTestId('person-asset-count')).toHaveText('2 assets');
  const unnamedCard = unnamedSection.locator('input[type="text"]').first().locator('xpath=..');
  await expect(unnamedCard.getByTestId('person-asset-count')).toHaveText('3 assets');

  await highlight(page, named.getByRole('heading', { name: 'Named people' }), 'New: Named people');
  await highlight(page, aliceCard.getByTestId('person-asset-count'), 'New: photo count');
  await shot(page, 'Named people are listed first, each with its photo count', { focus: named });

  await highlight(page, unnamedSection.getByRole('heading', { name: 'Unnamed people' }), 'New: Unnamed people');
  await highlight(page, unnamedCard.getByTestId('person-asset-count'), 'New: photo count');
  await shot(page, 'Unnamed faces are grouped in their own section', { focus: unnamedSection });
});
