import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({ // stocker le résultat dans une variable
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
      },
    });

    // Ne jamais retourner le mot de passe, même haché !
    const { password, ...result } = user;
    return result;
  }

  // 👇 NOUS MODIFIONS CETTE MÉTHODE 👇
  findAll() {
    return this.prisma.user.findMany({
      // Pour la sécurité, on sélectionne les champs à retourner
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
  }
}
