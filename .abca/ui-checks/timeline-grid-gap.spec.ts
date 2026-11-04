import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;
const GRID_GAP = 2;

test('timeline thumbnails are separated by a 2px gap', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();

  const now = new Date().toISOString();
  for (let i = 1; i <= 4; i++) {
    const response = await request.post(`${API}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        deviceAssetId: `grid-gap-${i}-${Date.now()}`,
        deviceId: 'ui-check-grid-gap',
        fileCreatedAt: now,
        fileModifiedAt: now,
        assetData: {
          name: `photo-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: readFileSync(join(process.env.UI_CHECK_ASSETS!, `photo-${i}.jpg`)),
        },
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  // Wait until the server has indexed all four uploads before opening the timeline.
  await expect
    .poll(
      async () => {
        const res = await request.get(`${API}/timeline/buckets`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok()) return 0;
        const buckets: { count: number }[] = await res.json();
        return buckets.reduce((sum, bucket) => sum + bucket.count, 0);
      },
      { timeout: 60_000 },
    )
    .toBe(4);

  await signIn(page);
  await page.goto('/photos');

  const thumbnails = page.locator('[data-asset-id]');
  await expect
    .poll(
      async () => {
        if ((await thumbnails.count()) < 4) await page.reload();
        return thumbnails.count();
      },
      { timeout: 90_000, intervals: [2_000] },
    )
    .toBe(4);

  // Measure the distance between neighbouring thumbnails: horizontally within a row and vertically between rows.
  const gaps = async () => {
    const boxes = await thumbnails.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }),
    );
    const horizontal: number[] = [];
    const vertical: number[] = [];
    for (const a of boxes) {
      // nearest right-hand neighbour in the same row
      const right = boxes.filter((b) => Math.abs(a.top - b.top) < 1 && b.left > a.left).sort((x, y) => x.left - y.left)[0];
      if (right) horizontal.push(right.left - a.right);
      // nearest box directly below in the same column
      const below = boxes.filter((b) => b.top > a.top + 1 && Math.abs(a.left - b.left) < 1).sort((x, y) => x.top - y.top)[0];
      if (below) vertical.push(below.top - a.bottom);
    }
    return { horizontal, vertical };
  };

  await expect.poll(async () => (await gaps()).horizontal.length, { timeout: 60_000 }).toBeGreaterThan(0);
  const { horizontal, vertical } = await gaps();
  for (const gap of [...horizontal, ...vertical]) {
    expect(gap).toBeCloseTo(GRID_GAP, 0);
  }
  expect(Math.min(...horizontal)).toBeCloseTo(GRID_GAP, 0);

  const first = thumbnails.first();
  await highlight(page, first, `Gap between thumbnails: ${GRID_GAP}px`);
  await shot(page, 'Timeline grid with 2px gaps between thumbnails', { focus: page.locator('[data-image-grid]').first() });
});
