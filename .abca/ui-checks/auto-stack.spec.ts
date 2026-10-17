import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight, shot, signIn } from './feval-annotate';

const apiUrl = process.env.PREVIEW_API_URL!;
const assetsDir = process.env.UI_CHECK_ASSETS!;

// Embeds an XMP packet with a Google camera BurstID, which is how burst shots are marked by cameras.
const withBurstId = (jpeg: Buffer, burstId: string) => {
  const xmp =
    '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    `<rdf:Description rdf:about="" xmlns:GCamera="http://ns.google.com/photos/1.0/camera/" GCamera:BurstID="${burstId}"/>` +
    '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
  const payload = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp, 'utf8')]);
  const header = Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]);
  // insert right after the SOI marker
  return Buffer.concat([jpeg.subarray(0, 2), header, payload, jpeg.subarray(2)]);
};

test('photos from the same burst are stacked automatically', async ({ page, request }) => {
  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const burstId = `ui-check-burst-${Date.now()}`;
  const upload = async (name: string, burst?: string) => {
    const original = readFileSync(join(assetsDir, name));
    const response = await request.post(`${apiUrl}/assets`, {
      headers,
      multipart: {
        deviceAssetId: `${name}-${Date.now()}`,
        deviceId: 'ui-check',
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        assetData: {
          name,
          mimeType: 'image/jpeg',
          buffer: burst ? withBurstId(original, burst) : original,
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).id as string;
  };

  const burstIds = [
    await upload('photo-1.jpg', burstId),
    await upload('photo-2.jpg', burstId),
    await upload('photo-3.jpg', burstId),
  ];
  const plainId = await upload('photo-4.jpg');

  // metadata extraction runs in the background, the stack appears once it has finished
  let stackId = '';
  await expect
    .poll(
      async () => {
        const stacks = await Promise.all(
          burstIds.map(async (id) => {
            const response = await request.get(`${apiUrl}/assets/${id}`, { headers });
            return (await response.json()).stack?.id as string | undefined;
          }),
        );
        stackId = stacks[0] ?? '';
        return !!stackId && stacks.every((id) => id === stackId);
      },
      { timeout: 90_000 },
    )
    .toBeTruthy();

  const stackResponse = await request.get(`${apiUrl}/stacks/${stackId}`, { headers });
  const stack = await stackResponse.json();
  expect(stack.assets).toHaveLength(3);
  const primaryId = stack.primaryAssetId as string;
  expect(burstIds).toContain(primaryId);

  // the plain photo is not part of any stack
  const plain = await (await request.get(`${apiUrl}/assets/${plainId}`, { headers })).json();
  expect(plain.stack).toBeFalsy();

  await signIn(page);
  await page.goto('/photos');

  const stackedThumbnail = page.locator(`[data-asset="${primaryId}"]`);
  await expect(stackedThumbnail).toBeVisible({ timeout: 60_000 });
  await expect(stackedThumbnail.getByText('3', { exact: true })).toBeVisible();
  for (const id of burstIds.filter((id) => id !== primaryId)) {
    await expect(page.locator(`[data-asset="${id}"]`)).toHaveCount(0);
  }
  await expect(page.locator(`[data-asset="${plainId}"]`)).toBeVisible();

  await highlight(page, stackedThumbnail, 'New: burst photos stacked automatically');
  await shot(page, 'Timeline shows one stack of 3 for the burst', { focus: stackedThumbnail });

  await page.goto(`/photos/${primaryId}`);
  const strip = page.locator('#stack-slideshow');
  await expect(strip).toBeVisible({ timeout: 30_000 });
  await expect(strip.locator('[data-asset]')).toHaveCount(3);

  await highlight(page, strip, 'New: all burst photos in the stack');
  await shot(page, 'Viewer shows the three stacked burst photos', { focus: strip });
});
