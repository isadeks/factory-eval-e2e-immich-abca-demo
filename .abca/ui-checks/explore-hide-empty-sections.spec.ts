import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const api = process.env.PREVIEW_API_URL!;

const login = async () => {
  const response = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD }),
  });
  expect(response.ok).toBe(true);
  return (await response.json()).accessToken as string;
};

const uploadPhoto = async (token: string) => {
  const bytes = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  const now = new Date().toISOString();
  const form = new FormData();
  form.append('deviceAssetId', `explore-check-${Date.now()}`);
  form.append('deviceId', 'explore-check');
  form.append('fileCreatedAt', now);
  form.append('fileModifiedAt', now);
  form.append('assetData', new Blob([bytes], { type: 'image/jpeg' }), 'photo-1.jpg');
  const response = await fetch(`${api}/assets`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  expect(response.ok).toBe(true);
};

test('explore page hides sections without items', async ({ page }) => {
  const section = (title: string) => page.locator('p', { hasText: new RegExp(`^${title}$`) });

  await signIn(page);
  await page.goto('/explore');

  // Empty instance: no section headings, only the placeholder.
  const placeholder = page.getByText('Upload more photos to explore your collection.');
  await expect(placeholder).toBeVisible();
  await expect(section('People')).toHaveCount(0);
  await expect(section('Places')).toHaveCount(0);
  await expect(section('Recently added')).toHaveCount(0);
  await highlight(page, placeholder, 'No empty sections, just the placeholder');
  await shot(page, 'Empty library: Explore shows no empty sections', { focus: placeholder });

  // Once there is a recently added photo, only that section appears.
  await uploadPhoto(await login());
  await expect(async () => {
    await page.goto('/explore');
    await expect(section('Recently added')).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 60_000 });

  await expect(section('People')).toHaveCount(0);
  await expect(section('Places')).toHaveCount(0);
  await expect(placeholder).toHaveCount(0);
  await highlight(page, section('Recently added'), 'Only non-empty section');
  await shot(page, 'With one photo only "Recently added" is shown', { focus: section('Recently added') });
});
