import { getAssetInfo, LoginResponseDto, searchStacks } from '@immich/sdk';
import { exiftool } from 'exiftool-vendored';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { asBearerAuth, utils } from 'src/utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('automatic stacking', () => {
  let admin: LoginResponseDto;
  let tmp: string;
  let counter = 0;

  const createImage = async (burstId?: string) => {
    counter++;
    const file = join(tmp, `image-${counter}.jpg`);
    await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: counter * 20, g: 100, b: 150 } },
    })
      .jpeg()
      .toFile(file);

    if (burstId) {
      await exiftool.write(file, { 'XMP-GCamera:BurstID': burstId }, ['-overwrite_original']);
    }

    return { filename: `image-${counter}.jpg`, bytes: await readFile(file) };
  };

  const upload = async (burstId: string | undefined, fileCreatedAt: string) => {
    const assetData = await createImage(burstId);
    return utils.createAsset(admin.accessToken, { assetData, fileCreatedAt });
  };

  const getStackId = async (id: string) => {
    const asset = await getAssetInfo({ id }, { headers: asBearerAuth(admin.accessToken) });
    return asset.stack?.id;
  };

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    tmp = await mkdtemp(join(tmpdir(), 'immich-auto-stack-'));
  });

  afterAll(async () => {
    await exiftool.end();
    await rm(tmp, { recursive: true, force: true });
  });

  it('should stack photos that belong to the same burst', async () => {
    const first = await upload('burst-a', '2024-01-01T10:00:00.000Z');
    const second = await upload('burst-a', '2024-01-01T10:00:01.000Z');
    const third = await upload('burst-a', '2024-01-01T10:00:02.000Z');

    await expect
      .poll(
        async () => {
          const ids = await Promise.all([first, second, third].map(({ id }) => getStackId(id)));
          return ids[0] && ids.every((id) => id === ids[0]);
        },
        { timeout: 30_000 },
      )
      .toBeTruthy();

    const stacks = await searchStacks({}, { headers: asBearerAuth(admin.accessToken) });
    const stack = stacks.find(({ assets }) => assets.some(({ id }) => id === first.id));
    expect(stack).toBeDefined();
    expect(stack!.assets).toHaveLength(3);
    expect(stack!.assets.map(({ id }) => id).sort()).toEqual([first.id, second.id, third.id].sort());
  });

  it('should not stack photos without a burst id or with a different burst id', async () => {
    const plain = await upload(undefined, '2024-02-01T10:00:00.000Z');
    const otherBurst = await upload('burst-b', '2024-02-01T10:00:01.000Z');
    const otherBurst2 = await upload('burst-c', '2024-02-01T10:00:02.000Z');

    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

    expect(await getStackId(plain.id)).toBeUndefined();
    expect(await getStackId(otherBurst.id)).toBeUndefined();
    expect(await getStackId(otherBurst2.id)).toBeUndefined();
  });
});
