import { LoginResponseDto } from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/people/suggestions', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  const createSuggestion = async (owner: LoginResponseDto, hidden = false) => {
    const db = await utils.connectDatabase();
    const [existing, unsure] = await Promise.all([
      utils.createPerson(owner.accessToken, { name: 'Alice' }),
      utils.createPerson(owner.accessToken, { name: '', isHidden: hidden }),
    ]);
    const { rows } = await db.query<{ id: string }>(
      'INSERT INTO person_match_suggestion ("personId", "suggestedPersonId", "distance") VALUES ($1, $2, $3) RETURNING id',
      [unsure.id, existing.id, 0.55],
    );
    return { existing, unsure, id: rows[0].id };
  };

  const personStatus = async (owner: LoginResponseDto, id: string) => {
    const { status } = await request(app).get(`/people/${id}`).set('Authorization', `Bearer ${owner.accessToken}`);
    return status;
  };

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  describe('GET /people/suggestions', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/people/suggestions');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should be empty when the face similarity algorithm is sure about everything', async () => {
      const { status, body } = await request(app)
        .get('/people/suggestions')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should list the unsure matches of the user, and only of the user', async () => {
      const { existing, unsure, id } = await createSuggestion(admin);

      const { status, body } = await request(app)
        .get('/people/suggestions')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([
        {
          id,
          distance: 0.55,
          person: expect.objectContaining({ id: unsure.id, name: '' }),
          suggestedPerson: expect.objectContaining({ id: existing.id, name: 'Alice' }),
        },
      ]);

      const other = await request(app).get('/people/suggestions').set('Authorization', `Bearer ${user.accessToken}`);
      expect(other.status).toBe(200);
      expect(other.body).toEqual([]);
    });

    it('should not list suggestions about hidden people', async () => {
      const db = await utils.connectDatabase();
      await db.query('DELETE FROM person_match_suggestion');
      await createSuggestion(user, true);

      const { status, body } = await request(app)
        .get('/people/suggestions')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('POST /people/suggestions/:id/confirm', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/people/suggestions/${uuidDto.notFound}/confirm`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not find the suggestion of another user', async () => {
      const { id } = await createSuggestion(admin);

      const { status } = await request(app)
        .post(`/people/suggestions/${id}/confirm`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(404);
    });

    it('should merge the unsure person into the existing person', async () => {
      const { existing, unsure, id } = await createSuggestion(admin);

      const { status, body } = await request(app)
        .post(`/people/suggestions/${id}/confirm`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: existing.id, name: 'Alice' }));

      expect(await personStatus(admin, existing.id)).toBe(200);
      expect(await personStatus(admin, unsure.id)).toBe(400);

      const after = await request(app).get('/people/suggestions').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(after.body).not.toContainEqual(expect.objectContaining({ id }));
    });
  });

  describe('POST /people/suggestions/:id/reject', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/people/suggestions/${uuidDto.notFound}/reject`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not find the suggestion of another user', async () => {
      const { id } = await createSuggestion(admin);

      const { status } = await request(app)
        .post(`/people/suggestions/${id}/reject`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(404);
    });

    it('should keep both people and stop asking', async () => {
      const { existing, unsure, id } = await createSuggestion(admin);

      const { status } = await request(app)
        .post(`/people/suggestions/${id}/reject`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      expect(await personStatus(admin, existing.id)).toBe(200);
      expect(await personStatus(admin, unsure.id)).toBe(200);

      const after = await request(app).get('/people/suggestions').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(after.body).not.toContainEqual(expect.objectContaining({ id }));
    });
  });
});
