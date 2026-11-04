import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

const login = async () => {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  expect(response.ok).toBe(true);
  return (await response.json()).accessToken as string;
};

const upload = async (token: string, file: string, takenAt: Date) => {
  const form = new FormData();
  const data = readFileSync(join(process.env.UI_CHECK_ASSETS!, file));
  form.append('assetData', new Blob([data], { type: 'image/jpeg' }), file);
  form.append('deviceAssetId', `${file}-${takenAt.getTime()}-${Math.random()}`);
  form.append('deviceId', 'ui-check');
  form.append('fileCreatedAt', takenAt.toISOString());
  form.append('fileModifiedAt', takenAt.toISOString());
  const response = await fetch(`${API}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  expect(response.ok).toBe(true);
  return (await response.json()).id as string;
};

const getAsset = async (token: string, id: string) => {
  const response = await fetch(`${API}/assets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.json();
};

// Sets the capture date once metadata extraction has finished (so it can't overwrite it), then waits for it to stick.
const setTakenAt = async (token: string, id: string, iso: string) => {
  await expect.poll(async () => (await getAsset(token, id)).exifInfo?.exifImageWidth ?? null, { timeout: 60_000 }).not.toBeNull();
  const response = await fetch(`${API}/assets/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateTimeOriginal: iso }),
  });
  expect(response.ok).toBe(true);
  await expect
    .poll(async () => (await getAsset(token, id)).localDateTime, { timeout: 60_000 })
    .toBe(new Date(iso).toISOString());
};

test('timeline day header shows the year only when it is not the current year', async ({ page }) => {
  const token = await login();
  const now = new Date();

  const oldId = await upload(token, 'photo-1.jpg', new Date('2020-03-15T10:00:00.000Z'));
  await setTakenAt(token, oldId, '2020-03-15T10:00:00.000Z');

  // A date earlier this year that is older than a week (only possible once we are past the first weeks of the year).
  const earlierThisYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 10, 0, 0));
  const hasEarlierThisYear = now.getTime() - earlierThisYear.getTime() > 14 * 24 * 3600 * 1000;
  if (hasEarlierThisYear) {
    const id = await upload(token, 'photo-2.jpg', earlierThisYear);
    await setTakenAt(token, id, earlierThisYear.toISOString());
  }

  await signIn(page);
  await page.goto('/photos');

  const oldHeader = page.locator('[data-group] span[title]', { hasText: 'Mar 15, 2020' });
  await expect(oldHeader).toBeVisible({ timeout: 30_000 });
  await highlight(page, oldHeader, 'Previous year: shows 2020');
  await shot(page, 'Header of an older year includes the year', { focus: oldHeader });

  if (hasEarlierThisYear) {
    const thisYearHeader = page.locator('[data-group] span[title]', { hasText: 'Jan 1' }).first();
    await expect(thisYearHeader).toBeVisible({ timeout: 30_000 });
    await expect(thisYearHeader).not.toContainText(String(now.getUTCFullYear()));
    await highlight(page, thisYearHeader, 'Current year: no year');
    await shot(page, 'Header of the current year has no year', { focus: thisYearHeader });
  }
});
