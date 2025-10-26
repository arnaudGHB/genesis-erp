import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'please-set-JWT_SECRET', // Read from env (must match AuthModule)
    });
  }

  async validate(payload: any) {
    // payload.sub contient l'ID de l'utilisateur
    const user = await this.usersService.findOneWithPermissions(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // On retire le mot de passe avant de l'attacher à la requête
    const { password, ...result } = user;
    return result;
  }
}
