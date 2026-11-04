import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

// Builds a little-endian EXIF APP1 segment with ExposureTime 1/250, ISO 800 and a DateTimeOriginal.
const buildExifSegment = () => {
  const tiff = Buffer.alloc(96);
  tiff.write('II', 0, 'ascii');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  // IFD0: one entry pointing to the Exif sub-IFD at offset 26
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x87_69, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(26, 18);
  tiff.writeUInt32LE(0, 22);
  // Exif IFD: ExposureTime, ISO, DateTimeOriginal
  tiff.writeUInt16LE(3, 26);
  tiff.writeUInt16LE(0x82_9a, 28);
  tiff.writeUInt16LE(5, 30);
  tiff.writeUInt32LE(1, 32);
  tiff.writeUInt32LE(68, 36);
  tiff.writeUInt16LE(0x88_27, 40);
  tiff.writeUInt16LE(3, 42);
  tiff.writeUInt32LE(1, 44);
  tiff.writeUInt16LE(800, 48);
  tiff.writeUInt16LE(0x90_03, 52);
  tiff.writeUInt16LE(2, 54);
  tiff.writeUInt32LE(20, 56);
  tiff.writeUInt32LE(76, 60);
  tiff.writeUInt32LE(0, 64);
  tiff.writeUInt32LE(1, 68);
  tiff.writeUInt32LE(250, 72);
  tiff.write('2026:02:02 10:00:00\0', 76, 'ascii');
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff.subarray(0, 96)]);
  const header = Buffer.from([0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([header, body]);
};

// Replaces any existing EXIF APP1 segments of a JPEG with ours.
const withExif = (jpeg: Buffer) => {
  const parts: Buffer[] = [jpeg.subarray(0, 2), buildExifSegment()];
  let pos = 2;
  while (pos < jpeg.length && jpeg[pos] === 0xff && jpeg[pos + 1] !== 0xda) {
    const length = jpeg.readUInt16BE(pos + 2);
    const isExif = jpeg[pos + 1] === 0xe1 && jpeg.subarray(pos + 4, pos + 8).toString('ascii') === 'Exif';
    if (!isExif) {
      parts.push(jpeg.subarray(pos, pos + 2 + length));
    }
    pos += 2 + length;
  }
  parts.push(jpeg.subarray(pos));
  return Buffer.concat(parts);
};

test('info panel shows ISO and shutter speed from EXIF', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const jpeg = withExif(readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg')));
  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `iso-shutter-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: { name: 'iso-shutter.jpg', mimeType: 'image/jpeg', buffer: jpeg },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  // wait for metadata extraction
  await expect
    .poll(async () => {
      const res = await request.get(`${API}/assets/${id}`, { headers });
      return (await res.json()).exifInfo?.iso;
    })
    .toBe(800);

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  const exposure = panel.getByText('1/250 s');
  const iso = panel.getByText('ISO 800');
  await expect(exposure).toBeVisible();
  await expect(iso).toBeVisible();

  await highlight(page, exposure, 'New: shutter speed');
  await highlight(page, iso, 'New: ISO');
  await shot(page, 'Info panel shows shutter speed and ISO', { focus: panel.locator('div.flex.gap-2.text-sm').filter({ hasText: 'ISO 800' }) });
});
