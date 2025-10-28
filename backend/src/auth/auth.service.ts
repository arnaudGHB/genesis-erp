import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    // Validation des entrées
    if (!email || !pass) {
      throw new BadRequestException('Email and password are required');
    }

    if (email.length > 254) {
      throw new BadRequestException('Email too long');
    }

    // En mode DEV, simplifier le login pour éviter tout blocage
    if (process.env.DEV_MODE === 'true') {
      const accessToken = await this.jwtService.signAsync(
        { sub: 'dev-user', email: 'dev@example.com' },
        { expiresIn: '1h' } as any,
      );
      const refreshToken = await this.jwtService.signAsync(
        { sub: 'dev-user', email: 'dev@example.com' },
        { expiresIn: '7d' } as any,
      );
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: 'dev-user', email: 'dev@example.com', name: 'Développeur' }
      };
    }

    // Mode PRODUCTION: validation complète
    try {
      // 1. Trouver l'utilisateur par email
      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 2. Comparer le mot de passe fourni avec le mot de passe haché
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 3. Générer les tokens JWT
      const payload = { sub: user.id, email: user.email };
      const accessToken = await this.jwtService.signAsync(
        payload,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as any,
      );
      const refreshToken = await this.jwtService.signAsync(
        payload,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any,
      );

      // 4. Persister le refresh token de manière sécurisée
      const expiresAt = new Date(
        Date.now() + (Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000),
      );
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Créer le refresh token en DB avec gestion d'erreur appropriée
      await this.prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
        },
      });

      // Nettoyer les vieux tokens en arrière-plan
      this.cleanupOldTokens(user.id).catch((err) =>
        console.warn('Cleanup tokens failed (non-blocking):', err),
      );

      // Retourner les informations utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = user;

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      // Re-throw UnauthorizedException as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Pour les autres erreurs, logger et retourner une erreur générique
      console.error('Auth error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateRefreshToken(token: string, userId: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const refreshToken = await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          userId,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return !!refreshToken;
    } catch (error) {
      console.error('Refresh token validation error:', error);
      return false;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    } catch (error) {
      console.error('Token revocation error:', error);
    }
  }

  /**
   * Nettoyer les vieux refresh tokens pour limiter à 5 tokens actifs par user
   */
  private async cleanupOldTokens(userId: string): Promise<void> {
    try {
      const maxTokens = Number(process.env.REFRESH_TOKEN_MAX) || 5;
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: { userId, revoked: false },
        orderBy: { createdAt: 'desc' },
      });

      if (activeTokens.length > maxTokens) {
        const tokensToRevoke = activeTokens.slice(maxTokens);
        const idsToRevoke = tokensToRevoke.map((t) => t.id);
        await this.prisma.refreshToken.updateMany({
          where: { id: { in: idsToRevoke } },
          data: { revoked: true },
        });
      }
    } catch (error) {
      console.warn('Token cleanup failed:', error);
    }
  }
}
