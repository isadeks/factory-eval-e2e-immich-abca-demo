import { LoginResponseDto, SharedLinkType, getAllSharedLinks } from '@immich/sdk';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/shared-links view count', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  it('should start at 0, count every view and survive an edit', async () => {
    const asset = await utils.createAsset(admin.accessToken);
    const link = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Individual,
      assetIds: [asset.id],
    });
    expect(link.viewCount).toBe(0);

    for (let i = 0; i < 3; i++) {
      const { status } = await request(app).get('/shared-links/me').query({ key: link.key });
      expect(status).toBe(200);
    }

    const links = await getAllSharedLinks({}, { headers: asBearerAuth(admin.accessToken) });
    expect(links.find(({ id }) => id === link.id)?.viewCount).toBe(3);

    const { status, body } = await request(app)
      .patch(`/shared-links/${link.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ description: 'edited' });
    expect(status).toBe(200);
    expect(body.viewCount).toBe(3);
  });

  it('should not count views of other links or failed attempts', async () => {
    const asset = await utils.createAsset(admin.accessToken);
    const [viewed, untouched] = await Promise.all([
      utils.createSharedLink(admin.accessToken, { type: SharedLinkType.Individual, assetIds: [asset.id] }),
      utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        password: 'secret',
      }),
    ]);

    await request(app).get('/shared-links/me').query({ key: viewed.key });
    // password required, so this is not a view
    const { status } = await request(app).get('/shared-links/me').query({ key: untouched.key });
    expect(status).toBe(401);
    await request(app).get('/shared-links/me').query({ key: `${viewed.key}foo` });

    const links = await getAllSharedLinks({}, { headers: asBearerAuth(admin.accessToken) });
    expect(links.find(({ id }) => id === viewed.id)?.viewCount).toBe(1);
    expect(links.find(({ id }) => id === untouched.id)?.viewCount).toBe(0);
  });
});
