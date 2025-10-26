import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// increase timeout for slow e2e (db, app init)
jest.setTimeout(30000);

describe('Auth refresh rotation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUser = { email: 'e2e-refresh@example.com', password: 'P@ssw0rd!' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);

    // ensure clean state
    await prisma.refreshToken.deleteMany({ where: { user: { email: testUser.email } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {});

    const hashed = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({ data: { email: testUser.email, password: hashed } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.refreshToken.deleteMany({ where: { user: { email: testUser.email } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {});
    }
    if (app) await app.close();
  });

  it('login -> refresh rotates refresh token -> logout', async () => {
    // login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(loginRes.body).toHaveProperty('access_token');
  const setCookie = loginRes.headers['set-cookie'];
  expect(setCookie).toBeDefined();
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie as string];
  const cookie = cookies.find((c: string) => c.startsWith('refresh_token'));
  expect(cookie).toBeDefined();

    // call refresh using cookie
    const agent = request.agent(app.getHttpServer());
    const refreshRes = await agent.post('/auth/refresh').set('Cookie', cookie).send().expect(200);
    expect(refreshRes.body).toHaveProperty('access_token');
    const refreshSetCookie = refreshRes.headers['set-cookie'];
    expect(refreshSetCookie).toBeDefined();

    // logout should clear cookie
    const logoutRes = await agent.post('/auth/logout').set('Cookie', refreshSetCookie).send().expect(200);
    expect(logoutRes.body).toEqual({ ok: true });

    // verify DB: all tokens for user are revoked
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const tokens = await prisma.refreshToken.findMany({ where: { userId: user!.id } });
    expect(tokens.every(t => t.revoked)).toBeTruthy();
  }, 20000);
});
