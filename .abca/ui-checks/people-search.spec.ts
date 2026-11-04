import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('people page: the search box filters the grid by name, ignoring case', async ({
  page,
  request,
}) => {
  const login = await request.post(`${API}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const headers = {
    Authorization: `Bearer ${(await login.json()).accessToken}`,
  };

  // A person only shows up on the People page when it is named (or has enough faces) and has a face on an asset.
  const names = ['Alice Smith', 'Bob Jones', 'Carol Alison'];
  for (const [index, name] of names.entries()) {
    const upload = await request.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `people-search-${index}-${Date.now()}`,
        deviceId: 'people-search-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name: `photo-${index + 1}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(
            join(process.env.UI_CHECK_ASSETS!, `photo-${index + 1}.jpg`),
          ),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
    const { id: assetId } = await upload.json();

    const person = await request.post(`${API}/people`, {
      headers,
      data: { name },
    });
    expect(person.ok()).toBeTruthy();
    const { id: personId } = await person.json();

    const face = await request.post(`${API}/faces`, {
      headers,
      data: {
        assetId,
        personId,
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
  await page.goto('/people');

  const nameInputs = page.getByPlaceholder('Add a name');
  const searchBox = page.getByPlaceholder('Search people');
  const shownNames = () =>
    expect.poll(() =>
      nameInputs.evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value).sort(),
      ),
    );

  await expect(nameInputs).toHaveCount(3, { timeout: 30_000 });
  await shownNames().toEqual([...names].sort());
  await highlight(page, searchBox, 'Search box');
  await shot(page, 'People page lists everyone before searching', {
    focus: searchBox,
  });

  // upper case query still matches "Alice Smith" and "Carol Alison"
  await searchBox.fill('ALI');
  await shownNames().toEqual(['Alice Smith', 'Carol Alison']);
  await highlight(page, searchBox, 'Typed "ALI"');
  await shot(page, 'Upper case query keeps only matching people', {
    focus: searchBox,
  });

  // a more specific, mixed-case query narrows it down to one person
  await searchBox.fill('bOb');
  await shownNames().toEqual(['Bob Jones']);
  await shot(page, 'Mixed case query narrows the grid to one person', {
    focus: searchBox,
  });

  // nothing matches
  await searchBox.fill('zzzz');
  await expect(nameInputs).toHaveCount(0);
  await expect(page.getByText('No people named "zzzz"')).toBeVisible();
  await shot(page, 'Unknown name shows the empty state');
});
