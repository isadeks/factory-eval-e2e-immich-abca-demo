import { expect, test } from '@playwright/test';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('library page shows a spinner while a scan runs', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const me = await (await request.get(`${API}/users/me`, { headers })).json();
  const dir = join(process.env.PREVIEW_IMPORT_DIR!, 'spinner-library');
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'), join(dir, 'photo-1.jpg'));

  const created = await request.post(`${API}/libraries`, {
    headers,
    data: { ownerId: me.id, name: 'Spinner library', importPaths: [dir] },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const library = await created.json();

  // Keep the library queue busy so the spinner stays visible long enough to observe; release it afterwards.
  let busy = true;
  await page.route('**/api/queues/library', async (route) => {
    if (!busy) {
      return route.continue();
    }
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, statistics: { ...body.statistics, active: 1 } } });
  });

  await signIn(page);
  await page.goto('/admin/library-management');

  const row = page.getByRole('row', { name: /Spinner library/ });
  await expect(row).toBeVisible();
  const spinner = row.getByTestId('library-scan-spinner');
  await expect(spinner).toHaveCount(0);

  await row.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('menuitem', { name: 'Scan' }).click();

  await expect(spinner).toBeVisible();
  await highlight(page, spinner, 'New: scan spinner');
  await shot(page, 'Spinner next to the library while the scan runs', { focus: row });

  busy = false;
  await expect(spinner).toHaveCount(0, { timeout: 30_000 });
  await shot(page, 'Spinner is gone once the scan finished', { focus: row });

  await page.goto(`/admin/library-management/${library.id}`);
  await expect(page.getByRole('heading', { name: 'Spinner library' })).toBeVisible();
  await expect(page.getByTestId('library-scan-spinner')).toHaveCount(0);
});
