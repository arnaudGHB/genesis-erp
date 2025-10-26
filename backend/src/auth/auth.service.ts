import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async signIn(
    email: string,
    pass: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{ access_token: string; refresh_token: string }> {
    // 1. Trouver l'utilisateur par email
    const user = await this.usersService.findOneByEmail(email); // Méthode à créer !

    // 2. Comparer le mot de passe fourni avec le mot de passe haché
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Si tout est bon, générer et retourner le token JWT
    const payload = { sub: user.id, email: user.email };
  const accessToken = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '60m' } as any);
  const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any);

    // Persist hashed refresh token for revocation support
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000));

    // Hash the refresh token before storing (SHA-256 hex)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Create refresh token record with tokenHash and optional audit fields
    const created = await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });

    // Limit active refresh tokens per user to REFRESH_TOKEN_MAX (default 5)
    const maxTokens = Number(process.env.REFRESH_TOKEN_MAX) || 5;
    try {
      const activeCount = await this.prisma.refreshToken.count({ where: { userId: user.id, revoked: false } });
      if (activeCount > maxTokens) {
        const toRevoke = activeCount - maxTokens;
        const oldTokens = await this.prisma.refreshToken.findMany({
          where: { userId: user.id, revoked: false },
          orderBy: { createdAt: 'asc' },
          take: toRevoke,
        });
        const ids = oldTokens.map(t => t.id);
        if (ids.length) {
          await this.prisma.refreshToken.updateMany({ where: { id: { in: ids } }, data: { revoked: true } });
        }
      }
    } catch (e) {
      // don't block sign-in if cleanup fails
      // eslint-disable-next-line no-console
      console.warn('refresh token cleanup failed', String(e));
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
