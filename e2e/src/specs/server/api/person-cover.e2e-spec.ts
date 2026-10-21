import { LoginResponseDto } from '@immich/sdk';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const setFileCreatedAt = async (assetId: string, date: string) => {
  const db = await utils.connectDatabase();
  await db.query('UPDATE asset SET "fileCreatedAt" = $2 WHERE id = $1', [assetId, date]);
};

const getCoverAssetId = async (personId: string) => {
  const db = await utils.connectDatabase();
  const { rows } = await db.query<{ assetId: string | null }>(
    'SELECT asset_face."assetId" FROM person LEFT JOIN asset_face ON asset_face.id = person."faceAssetId" WHERE person.id = $1',
    [personId],
  );
  return rows[0]?.assetId;
};

describe('person cover photo', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  it('should default to the latest photo of the person', async () => {
    const [oldest, latest, middle, added] = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);
    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
    await Promise.all([
      setFileCreatedAt(oldest.id, '2020-01-01T00:00:00.000Z'),
      setFileCreatedAt(latest.id, '2024-06-01T00:00:00.000Z'),
      setFileCreatedAt(middle.id, '2022-03-01T00:00:00.000Z'),
      setFileCreatedAt(added.id, '2021-01-01T00:00:00.000Z'),
    ]);

    // a person with several photos, but no cover yet
    const person = await utils.createPerson(admin.accessToken, { name: '' });
    for (const asset of [oldest, latest, middle]) {
      await utils.createFace({ assetId: asset.id, personId: person.id });
    }
    expect(await getCoverAssetId(person.id)).toBeNull();

    // adding another face makes the server pick a cover
    const { status } = await request(app).post('/faces').set('Authorization', `Bearer ${admin.accessToken}`).send({
      assetId: added.id,
      personId: person.id,
      imageWidth: 100,
      imageHeight: 100,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    });
    expect(status).toBe(201);

    expect(await getCoverAssetId(person.id)).toBe(latest.id);
  });
});
