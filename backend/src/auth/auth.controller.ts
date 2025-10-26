import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Res, Req, Request, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, Request as ExpressRequest } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from '@nestjs/passport';
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
    const tokens = await this.authService.signIn(signInDto.email, signInDto.password, meta);

    // Set refresh token in a secure HttpOnly cookie
    // In production, if the frontend is hosted on a different domain (Vercel/Netlify/etc.)
    // browsers require SameSite='none' and Secure=true to accept cross-site cookies.
    const cookieSameSite = (process.env.COOKIE_SAMESITE as any) || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: cookieSameSite as any,
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token: tokens.access_token };
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
    const refreshToken = (req.cookies as any)?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    // Verify token and rotate it atomically in the DB (create new refresh token + revoke old)
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { ignoreExpiration: false });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();
    const refreshTtlMs = Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000;
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    // Use a transaction to atomically revoke the old token and create a new one
    const { newRefreshToken } = await this.prisma.$transaction(async (tx) => {
      // Lookup by tokenHash (we store hashes, not the raw token)
    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await tx.refreshToken.findUnique({ where: { tokenHash: incomingHash } });
      if (!record || record.revoked || record.expiresAt < now) {
        throw new UnauthorizedException('Refresh token revoked or expired');
      }

      // Revoke old token
    await tx.refreshToken.updateMany({ where: { tokenHash: incomingHash }, data: { revoked: true } });

      // Issue a new refresh token
  const newToken = await this.jwtService.signAsync({ sub: payload.sub, email: payload.email }, { expiresIn: jwtRefreshExpiresIn } as any);
      const expiresAt = new Date(Date.now() + refreshTtlMs);

      const newHash = crypto.createHash('sha256').update(newToken).digest('hex');

      await tx.refreshToken.create({
        data: {
          tokenHash: newHash,
          userId: record.userId,
          expiresAt,
          ip: (req.ip as string) || (req.headers['x-forwarded-for'] as string | undefined),
          userAgent: req.get('user-agent') || (req.headers['user-agent'] as string | undefined),
        },
      });

      return { newRefreshToken: newToken };
    });

    // Set new refresh token cookie (see sameSite handling note above)
    const cookieSameSite2 = (process.env.COOKIE_SAMESITE as any) || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: cookieSameSite2 as any,
      maxAge: refreshTtlMs,
    });

    // Issue new access token
  const accessToken = await this.jwtService.signAsync({ sub: payload.sub, email: payload.email }, { expiresIn: process.env.JWT_EXPIRES_IN || '60m' } as any);
    return { access_token: accessToken };
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: incomingHash }, data: { revoked: true } });
    }
  // Clear cookie using same site options if needed
  res.clearCookie('refresh_token');
    return { ok: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
