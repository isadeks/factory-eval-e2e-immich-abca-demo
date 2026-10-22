import { AssetMediaStatus, AssetTypeEnum, LoginResponseDto } from '@immich/sdk';
import { makeRandomImage } from 'src/generators';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

// The web "Camera" sidebar button uploads the captured picture through the regular asset upload endpoint.
describe('camera picture upload', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  it('should upload a camera capture like the web client does', async () => {
    const now = new Date().toISOString();
    const { status, body } = await request(app)
      .post('/assets')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .field('deviceAssetId', `web-image.jpg-${Date.now()}`)
      .field('deviceId', 'WEB')
      .field('fileCreatedAt', now)
      .field('fileModifiedAt', now)
      .field('isFavorite', 'false')
      .attach('assetData', makeRandomImage(), 'image.jpg');

    expect(status).toBe(201);
    expect(body).toEqual({ id: expect.any(String), status: AssetMediaStatus.Created });

    const asset = await utils.getAssetInfo(admin.accessToken, body.id);
    expect(asset).toEqual(
      expect.objectContaining({ originalFileName: 'image.jpg', type: AssetTypeEnum.Image }),
    );
  });
});
