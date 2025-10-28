import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Res, Req, Request, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, Request as ExpressRequest } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { FlexibleAuthGuard } from './flexible-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      ip: (req.ip as string) || (req.headers['x-forwarded-for'] as string | undefined),
      userAgent: req.get('user-agent') || (req.headers['user-agent'] as string | undefined),
    };

    const result = await this.authService.signIn(signInDto.email, signInDto.password, meta);

    // Set refresh token in a secure HttpOnly cookie
    // In production, if the frontend is hosted on a different domain (Vercel/Netlify/etc.)
    // browsers require SameSite='none' and Secure=true to accept cross-site cookies.
    const cookieSameSite = (process.env.COOKIE_SAMESITE as any) || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: cookieSameSite as any,
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: result.access_token,
      user: result.user
    };
  }

  @Get('debug')
  debug(@Req() req: ExpressRequest) {
    // This debug endpoint is intentionally conservative: disabled in production unless ALLOW_DEBUG=true
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG !== 'true') {
      throw new ForbiddenException('Debug endpoint disabled in production');
    }

    const origin = (req.headers.origin as string) || null;
    const cookieKeys = req.cookies ? Object.keys(req.cookies) : [];

    return {
      ok: true,
      origin,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      cookieKeys,
      hasRefreshCookie: !!(req.cookies as any)?.refresh_token,
      CORS_ORIGINS_env: process.env.CORS_ORIGINS || null,
      VERCEL_URL: process.env.VERCEL_URL || null,
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || null,
      NOTE: 'This endpoint returns only non-sensitive debug metadata. Do not enable in production unless necessary (set ALLOW_DEBUG=true).',
    };
  }

  @Post('refresh')
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    // En mode DEV, simplifier le refresh pour éviter les blocages
    if (process.env.DEV_MODE === 'true') {
      const accessToken = await this.jwtService.signAsync(
        { sub: 'dev-user', email: 'dev@example.com' },
        { expiresIn: '1h' } as any,
      );
      return { access_token: accessToken };
    }

    const refreshToken = (req.cookies as any)?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Vérifier le refresh token JWT
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        ignoreExpiration: false
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Valider le refresh token en base de données
    const isValid = await this.authService.validateRefreshToken(refreshToken, payload.sub);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Générer un nouveau access token
    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as any,
    );

    // Générer un nouveau refresh token (rotation)
    const newRefreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any,
    );

    // Révoquer l'ancien token et créer le nouveau
    await this.authService.revokeRefreshToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + (Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000),
    );
    const tokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: payload.sub,
        expiresAt,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Définir le nouveau cookie refresh
    const cookieSameSite = (process.env.COOKIE_SAMESITE as any) ||
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: cookieSameSite as any,
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // En mode DEV, juste supprimer le cookie
    if (process.env.DEV_MODE === 'true') {
      res.clearCookie('refresh_token');
      return { success: true, message: 'Logged out successfully' };
    }

    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      try {
        await this.authService.revokeRefreshToken(refreshToken);
      } catch (error) {
        // Log l'erreur mais ne pas bloquer le logout
        console.warn('Failed to revoke token on logout:', error);
      }
    }

    res.clearCookie('refresh_token');
    return { success: true, message: 'Logged out successfully' };
  }

  // Profile avec FlexibleAuthGuard
  @UseGuards(FlexibleAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
