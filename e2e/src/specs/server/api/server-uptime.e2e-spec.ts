import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/server/uptime', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  it('should require authentication', async () => {
    const { status, body } = await request(app).get('/server/uptime');
    expect(status).toBe(401);
    expect(body).toEqual(errorDto.unauthorized);
  });

  it('should require admin access', async () => {
    const { status, body } = await request(app)
      .get('/server/uptime')
      .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
    expect(status).toBe(403);
    expect(body).toEqual(errorDto.forbidden);
  });

  it('should return the server uptime', async () => {
    const { status, body } = await request(app)
      .get('/server/uptime')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(status).toBe(200);
    expect(body).toEqual({ uptimeSeconds: expect.any(Number) });
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
