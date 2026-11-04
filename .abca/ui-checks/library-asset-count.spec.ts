import { expect, test, type APIRequestContext } from '@playwright/test';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

// Wait until no background job is running or queued, so that nothing is left running when the check ends.
const waitForQueuesIdle = async (
  request: APIRequestContext,
  headers: Record<string, string>,
) => {
  await expect
    .poll(
      async () => {
        const queues: Array<{
          statistics: { active: number; waiting: number };
        }> = await (await request.get(`${api}/queues`, { headers })).json();
        return queues.reduce(
          (sum, { statistics }) => sum + statistics.active + statistics.waiting,
          0,
        );
      },
      { timeout: 60_000 },
    )
    .toBe(0);
};

test('external library list shows the asset count per library', async ({
  page,
  request,
}) => {
  const login = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.PREVIEW_ADMIN_EMAIL,
      password: process.env.PREVIEW_ADMIN_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken, userId } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const name = `Count library ${Date.now()}`;
  const dir = path.join(process.env.PREVIEW_IMPORT_DIR!, `count-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  for (const n of [1, 2, 3]) {
    copyFileSync(
      path.join(process.env.UI_CHECK_ASSETS!, `photo-${n}.jpg`),
      path.join(dir, `photo-${n}.jpg`),
    );
  }

  const created = await request.post(`${api}/libraries`, {
    headers,
    data: { ownerId: userId, name, importPaths: [dir] },
  });
  expect(created.ok()).toBeTruthy();
  const library = await created.json();

  try {
    expect(
      (
        await request.post(`${api}/libraries/${library.id}/scan`, { headers })
      ).ok(),
    ).toBeTruthy();

    await expect
      .poll(
        async () =>
          (
            await (
              await request.get(`${api}/libraries/${library.id}/statistics`, {
                headers,
              })
            ).json()
          ).total,
        { timeout: 90_000 },
      )
      .toBe(3);

    await signIn(page);
    await page.goto('/admin/library-management');

    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Assets' }),
    ).toBeVisible();
    const count = row.getByTestId('library-asset-count');
    await expect(count).toHaveText('3');

    await highlight(page, count, 'New: asset count');
    await shot(page, 'External library row shows its asset count', {
      focus: row,
    });
  } finally {
    // Leave the instance as found: no library, no files, no jobs still running.
    await waitForQueuesIdle(request, headers).catch(() => {});
    await request.delete(`${api}/libraries/${library.id}`, { headers });
    await waitForQueuesIdle(request, headers).catch(() => {});
    rmSync(dir, { recursive: true, force: true });
  }
});
