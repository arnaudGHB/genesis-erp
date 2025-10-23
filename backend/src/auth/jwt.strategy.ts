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
      secretOrKey: 'VOTRE_SECRET_TRES_COMPLIQUE_ICI', // Doit être le MÊME secret que dans auth.module
    });
  }

  async validate(payload: any) {
    // Cette méthode est appelée par passport-jwt si la signature du token est valide
    // Le `payload`  est le contenu décodé du JWT
    const user = await this.usersService.findOne(payload.sub); // payload.sub contient l'ID utilisateur
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // NestJS attachera cet objet `user`  à l'objet Request
  }
}
