import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, openInfoPanel, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

// Build a TIFF/EXIF block (little endian) with Make, Model and DateTimeOriginal.
function buildExif(make: string, model: string, lens: string, taken: string): Buffer {
  const ascii = (s: string) => Buffer.from(`${s}\0`, 'latin1');
  const makeB = ascii(make);
  const modelB = ascii(model);
  const lensB = ascii(lens);
  const takenB = ascii(taken);
  const ifd0Entries = 3;
  const ifd0Size = 2 + ifd0Entries * 12 + 4;
  const exifIfdSize = 2 + 2 * 12 + 4;
  const ifd0Off = 8;
  const exifIfdOff = ifd0Off + ifd0Size;
  const dataOff = exifIfdOff + exifIfdSize;
  const makeOff = dataOff;
  const modelOff = makeOff + makeB.length;
  const takenOff = modelOff + modelB.length;
  const lensOff = takenOff + takenB.length;
  const buf = Buffer.alloc(lensOff + lensB.length);
  buf.write('II', 0, 'latin1');
  buf.writeUInt16LE(42, 2);
  buf.writeUInt32LE(ifd0Off, 4);
  const entry = (o: number, tag: number, type: number, count: number, value: number) => {
    buf.writeUInt16LE(tag, o);
    buf.writeUInt16LE(type, o + 2);
    buf.writeUInt32LE(count, o + 4);
    buf.writeUInt32LE(value, o + 8);
  };
  buf.writeUInt16LE(ifd0Entries, ifd0Off);
  entry(ifd0Off + 2, 0x01_0f, 2, makeB.length, makeOff);
  entry(ifd0Off + 14, 0x01_10, 2, modelB.length, modelOff);
  entry(ifd0Off + 26, 0x87_69, 4, 1, exifIfdOff);
  buf.writeUInt16LE(2, exifIfdOff);
  entry(exifIfdOff + 2, 0x90_03, 2, takenB.length, takenOff);
  entry(exifIfdOff + 14, 0xa4_34, 2, lensB.length, lensOff);
  makeB.copy(buf, makeOff);
  modelB.copy(buf, modelOff);
  takenB.copy(buf, takenOff);
  lensB.copy(buf, lensOff);
  return buf;
}

// Replace the APP1 (EXIF) segment of a sample JPEG with ours.
function withCamera(jpeg: Buffer, make: string, model: string, lens: string, taken: string): Buffer {
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), buildExif(make, model, lens, taken)]);
  const app1 = Buffer.alloc(4);
  app1.writeUInt16BE(0xff_e1, 0);
  app1.writeUInt16BE(exif.length + 2, 2);
  const parts: Buffer[] = [jpeg.subarray(0, 2), app1, exif];
  let pos = 2;
  while (pos < jpeg.length && jpeg[pos] === 0xff) {
    const marker = jpeg[pos + 1];
    if (marker === 0xda) break;
    const len = jpeg.readUInt16BE(pos + 2);
    if (marker !== 0xe1) parts.push(jpeg.subarray(pos, pos + 2 + len));
    pos += 2 + len;
  }
  parts.push(jpeg.subarray(pos));
  return Buffer.concat(parts);
}

test('info panel shows the camera and lens on one line from EXIF', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const sample = readFileSync(join(process.env.UI_CHECK_ASSETS!, 'photo-1.jpg'));
  const now = new Date().toISOString();
  const upload = await request.post(`${API}/assets`, {
    headers,
    multipart: {
      deviceAssetId: `camera-info-${Date.now()}`,
      deviceId: 'ui-check',
      fileCreatedAt: now,
      fileModifiedAt: now,
      assetData: {
        name: 'camera.jpg',
        mimeType: 'image/jpeg',
        buffer: withCamera(sample, 'Canon', 'EOS R5 Mark II', 'RF24-70mm F2.8 L IS USM', '2026:02:03 04:05:06'),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const { id } = await upload.json();

  // wait for metadata extraction
  await expect
    .poll(async () => (await (await request.get(`${API}/assets/${id}`, { headers })).json()).exifInfo?.model, {
      timeout: 60_000,
    })
    .toBe('EOS R5 Mark II');
  await expect
    .poll(async () => (await (await request.get(`${API}/assets/${id}`, { headers })).json()).exifInfo?.lensModel, {
      timeout: 60_000,
    })
    .toBe('RF24-70mm F2.8 L IS USM');

  await signIn(page);
  await page.goto(`/photos/${id}`);
  const panel = await openInfoPanel(page);

  const camera = panel.getByTestId('detail-panel-camera');
  await expect(camera).toContainText('Canon');
  await expect(camera).toContainText('EOS R5 Mark II');
  await expect(camera).toContainText('RF24-70mm F2.8 L IS USM');
  await expect(camera).toHaveText(/Canon\s+EOS R5 Mark II\s+·\s+RF24-70mm F2\.8 L IS USM/);

  await highlight(page, camera, 'Camera · lens');
  await shot(page, 'Info panel shows camera and lens on one line', { focus: camera });
});
