import { LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/people asset count', () => {
  let admin: LoginResponseDto;
  let multipleFaces: PersonResponseDto;
  let single: PersonResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [multipleFaces, single] = await Promise.all([
      utils.createPerson(admin.accessToken, { name: 'two_assets_three_faces' }),
      utils.createPerson(admin.accessToken, { name: 'one_asset' }),
    ]);

    const [asset1, asset2] = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);

    await Promise.all([
      utils.createFace({ assetId: asset1.id, personId: multipleFaces.id }),
      utils.createFace({ assetId: asset1.id, personId: multipleFaces.id }),
      utils.createFace({ assetId: asset2.id, personId: multipleFaces.id }),
      utils.createFace({ assetId: asset1.id, personId: single.id }),
    ]);
  });

  it('should return the number of distinct assets each person appears in', async () => {
    const { status, body } = await request(app).get('/people').set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: multipleFaces.id, assetCount: 2 }),
        expect.objectContaining({ id: single.id, assetCount: 1 }),
      ]),
    );
  });
});
