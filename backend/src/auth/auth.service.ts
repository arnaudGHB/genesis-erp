import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    // 1. Trouver l'utilisateur par email
    const user = await this.usersService.findOneByEmail(email); // Méthode à créer !

    // 2. Comparer le mot de passe fourni avec le mot de passe haché
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Si tout est bon, générer et retourner le token JWT
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
