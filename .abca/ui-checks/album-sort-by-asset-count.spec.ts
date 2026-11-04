import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;

const login = async (request: APIRequestContext) => {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(response.ok()).toBeTruthy();
  const { accessToken } = await response.json();
  return { Authorization: `Bearer ${accessToken}` };
};

const uploadAsset = async (
  request: APIRequestContext,
  headers: Record<string, string>,
  n: number,
) => {
  const name = `photo-${n}.jpg`;
  const now = new Date().toISOString();
  const response = await request.post(`${apiUrl}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `album-sort-${name}`,
      deviceId: 'album-sort-ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name,
        mimeType: 'image/jpeg',
        buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)),
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  const { id } = await response.json();
  return id as string;
};

test('albums list can be sorted by number of items', async ({
  page,
  request,
}) => {
  const headers = await login(request);
  const ids: string[] = [];
  for (const n of [1, 2, 3]) {
    ids.push(await uploadAsset(request, headers, n));
  }

  const albums = [
    { albumName: 'Alpha album', assetIds: ids.slice(0, 1) },
    { albumName: 'Bravo album', assetIds: ids.slice(0, 3) },
    { albumName: 'Charlie album', assetIds: ids.slice(0, 2) },
  ];
  for (const album of albums) {
    const response = await request.post(`${apiUrl}/albums`, {
      headers,
      data: album,
    });
    expect(response.ok()).toBeTruthy();
  }

  // show the albums as a list, without grouping, so the column headers are available
  await page.addInitScript(() => {
    localStorage.setItem(
      'album-view-settings',
      JSON.stringify({
        view: 'List',
        filter: 'All',
        groupBy: 'None',
        groupOrder: 'desc',
        sortBy: 'Title',
        sortOrder: 'asc',
        collapsedGroups: {},
      }),
    );
  });
  await signIn(page);
  await page.goto('/albums');

  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Alpha album');

  const header = page
    .locator('thead')
    .getByRole('button', { name: 'Number of items' });
  await highlight(page, header, 'Sort by number of items');
  await shot(page, 'Albums list sorted by title, before sorting by items', {
    focus: page.locator('table'),
  });

  // first click: largest album first
  await header.click();
  await expect(rows.nth(0)).toContainText('Bravo album');
  await expect(rows.nth(0)).toContainText('3 items');
  await expect(rows.nth(1)).toContainText('Charlie album');
  await expect(rows.nth(1)).toContainText('2 items');
  await expect(rows.nth(2)).toContainText('Alpha album');
  await expect(rows.nth(2)).toContainText('1 item');
  await highlight(page, header, 'Descending by items');
  await shot(page, 'Albums sorted by number of items, largest first', {
    focus: page.locator('table'),
  });

  // second click: smallest album first
  await header.click();
  await expect(rows.nth(0)).toContainText('Alpha album');
  await expect(rows.nth(1)).toContainText('Charlie album');
  await expect(rows.nth(2)).toContainText('Bravo album');
  await highlight(page, header, 'Ascending by items');
  await shot(page, 'Albums sorted by number of items, smallest first', {
    focus: page.locator('table'),
  });
});
