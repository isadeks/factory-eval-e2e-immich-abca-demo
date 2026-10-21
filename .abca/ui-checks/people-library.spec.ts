import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

type Person = {
  id: string;
  name: string;
  thumbnailPath: string;
  isHidden: boolean;
  updatedAt: string;
};

test('People lives under Library, people start unnamed and unsure matches ask the user to confirm', async ({
  page,
  request,
}) => {
  // --- setup through the API: an admin token, six photos, two people with three faces each
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

  const upload = async (
    api: APIRequestContext,
    name: string,
    takenAt: string,
  ) => {
    const response = await api.post(`${API}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `ui-check-${name}`,
        deviceId: 'ui-check',
        fileCreatedAt: takenAt,
        fileModifiedAt: takenAt,
        assetData: {
          name,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, name)),
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    const { id } = await response.json();
    // the person cover is cut out of the preview, wait for it
    await expect
      .poll(
        async () =>
          (
            await api.get(`${API}/assets/${id}/thumbnail?size=preview`, {
              headers,
            })
          ).status(),
        {
          timeout: 60_000,
        },
      )
      .toBe(200);
    return id as string;
  };

  const createPerson = async (name: string, assetIds: string[]) => {
    const created = await request.post(`${API}/people`, {
      headers,
      data: { name },
    });
    expect(created.ok()).toBeTruthy();
    const person = (await created.json()) as Person;
    for (const assetId of assetIds) {
      const face = await request.post(`${API}/faces`, {
        headers,
        data: {
          assetId,
          personId: person.id,
          imageWidth: 1000,
          imageHeight: 1000,
          x: 300,
          y: 300,
          width: 400,
          height: 400,
        },
      });
      expect(face.ok()).toBeTruthy();
    }
    return (await (
      await request.get(`${API}/people/${person.id}`, { headers })
    ).json()) as Person;
  };

  const assetIds: string[] = [];
  for (let i = 1; i <= 6; i++) {
    assetIds.push(
      await upload(request, `photo-${i}.jpg`, `2024-0${i}-15T10:00:00.000Z`),
    );
  }
  const alice = await createPerson('Alice', assetIds.slice(0, 3));
  const unnamed = await createPerson('', assetIds.slice(3, 6));

  // --- 1. the People tab sits in the Library group of the sidebar
  await signIn(page);
  await page.goto('/photos');
  const library = page.getByText('Library', { exact: true }).first();
  const peopleLink = page
    .getByRole('navigation')
    .getByRole('link', { name: 'People', exact: true });
  const favoritesLink = page
    .getByRole('navigation')
    .getByRole('link', { name: 'Favorites', exact: true });
  await expect(peopleLink).toBeVisible();
  const [libraryBox, peopleBox, favoritesBox] = await Promise.all([
    library.boundingBox(),
    peopleLink.boundingBox(),
    favoritesLink.boundingBox(),
  ]);
  expect(libraryBox!.y).toBeLessThan(peopleBox!.y);
  expect(peopleBox!.y).toBeLessThan(favoritesBox!.y);
  await highlight(page, peopleLink, 'New: People under Library');
  await shot(page, 'People is listed under the Library group in the sidebar', {
    focus: peopleLink,
  });

  // --- 2. unsure matches show up as a question; mock the list, the rest is the real server
  let confirmed = false;
  await page.route(/\/api\/people\/suggestions$/, (route) =>
    route.fulfill({
      json: confirmed
        ? []
        : [
            {
              id: '00000000-0000-4000-8000-000000000001',
              distance: 0.55,
              person: unnamed,
              suggestedPerson: alice,
            },
          ],
    }),
  );
  await page.route(/\/api\/people\/suggestions\/[^/]+\/confirm$/, (route) => {
    confirmed = true;
    return route.fulfill({ json: alice });
  });

  await peopleLink.click();
  await expect(page).toHaveURL(/\/people$/);

  // people are unnamed by default
  const unnamedInput = page.locator(
    'input[placeholder="Add a name"]:placeholder-shown',
  );
  await expect(unnamedInput).toHaveCount(1);
  await expect(page.getByPlaceholder('Add a name')).toHaveCount(2);

  const question = page.getByTestId('person-match-suggestions');
  await expect(
    question.getByRole('heading', { name: 'Is this the same person?' }),
  ).toBeVisible();
  await expect(question.getByText('Alice')).toBeVisible();
  await expect(question.getByText('Unnamed person')).toBeVisible();
  await highlight(page, question, 'New: confirm unsure matches');
  await shot(
    page,
    'The algorithm is unsure about two faces and asks the user to confirm',
    { focus: question },
  );

  const confirmRequest = page.waitForRequest(
    (req) =>
      req.method() === 'POST' &&
      /\/api\/people\/suggestions\/[^/]+\/confirm$/.test(req.url()),
  );
  await question.getByRole('button', { name: 'Same person' }).click();
  await confirmRequest;
  await expect(page.getByTestId('person-match-suggestions')).toHaveCount(0);

  // --- 3. a person can be given a name
  await unnamedInput.focus();
  await page.keyboard.type('Bob');
  await page.keyboard.press('Enter');
  await expect
    .poll(
      async () =>
        (
          (await (
            await request.get(`${API}/people/${unnamed.id}`, { headers })
          ).json()) as Person
        ).name,
    )
    .toBe('Bob');
  await page.reload();
  const bobInput = page
    .locator('input[placeholder="Add a name"]')
    .and(page.locator('input:not(:placeholder-shown)'));
  await expect(bobInput).toHaveCount(2);
  await highlight(
    page,
    page.getByPlaceholder('Add a name').nth(1),
    'Name saved',
  );
  await shot(
    page,
    'The person now has a name; people without one stay unnamed',
  );
});
