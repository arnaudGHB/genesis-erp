import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: 'VOTRE_SECRET_TRES_COMPLIQUE_ICI',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
