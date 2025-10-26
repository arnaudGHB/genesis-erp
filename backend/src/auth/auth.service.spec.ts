// Mock bcrypt globally for this test file
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService (unit)', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let prisma: Partial<PrismaService>;

  beforeEach(() => {
    usersService = {
      findOneByEmail: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as any;

    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt1' }),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({}),
      },
    } as any;

    authService = new AuthService(usersService as any, jwtService as any, prisma as any);
  });

  it('signIn - should validate credentials, sign tokens and persist refresh token', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.c', password: 'hashed' } as any;
    (usersService.findOneByEmail as jest.Mock).mockResolvedValue(fakeUser);
  const result = await authService.signIn('a@b.c', 'password', { ip: '1.2.3.4', userAgent: 'jest' });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  expect((prisma as any).refreshToken.create).toHaveBeenCalled();
  });
});
