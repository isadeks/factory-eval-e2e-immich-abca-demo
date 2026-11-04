import { LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/people asset count', () => {
  let admin: LoginResponseDto;
  let namedPerson: PersonResponseDto;
  let unnamedPerson: PersonResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [namedPerson, unnamedPerson] = await Promise.all([
      utils.createPerson(admin.accessToken, { name: 'Counted' }),
      utils.createPerson(admin.accessToken, { name: '' }),
    ]);

    const [asset1, asset2, asset3, asset4] = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);

    await Promise.all([
      // two faces on the same asset must only count the asset once
      utils.createFace({ assetId: asset1.id, personId: namedPerson.id }),
      utils.createFace({ assetId: asset1.id, personId: namedPerson.id }),
      utils.createFace({ assetId: asset2.id, personId: namedPerson.id }),
      utils.createFace({ assetId: asset1.id, personId: unnamedPerson.id }),
      utils.createFace({ assetId: asset2.id, personId: unnamedPerson.id }),
      utils.createFace({ assetId: asset3.id, personId: unnamedPerson.id }),
      utils.createFace({ assetId: asset4.id, personId: unnamedPerson.id }),
    ]);
  });

  it('should return the number of distinct assets for each person', async () => {
    const { status, body } = await request(app)
      .get('/people')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ withHidden: true });

    expect(status).toBe(200);
    expect(body.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: namedPerson.id, assetCount: 2 }),
        expect.objectContaining({ id: unnamedPerson.id, assetCount: 4 }),
      ]),
    );
  });

  it('should not include the asset count when fetching a single person', async () => {
    const { status, body } = await request(app)
      .get(`/people/${namedPerson.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body).not.toHaveProperty('assetCount');
  });
});
