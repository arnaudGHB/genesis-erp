import { Module } from '@nestjs/common';
import 'dotenv/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { FlexibleAuthGuard } from './flexible-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'please-set-JWT_SECRET',
      // cast expiresIn to any because process.env returns string | undefined
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '60m') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FlexibleAuthGuard, RolesGuard],
  exports: [FlexibleAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
