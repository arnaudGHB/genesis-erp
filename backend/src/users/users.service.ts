import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
  findAll(pagination?: { skip?: number; take?: number }) {
    const { skip = 0, take = 20 } = pagination || {};
    return this.prisma.user.findMany({
      skip,
      take,
      // Pour la sécurité, on sélectionne les champs à retourner
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Réutilise findOne pour vérifier que l'utilisateur existe

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: id },
      data: updateUserDto,
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie que l'utilisateur existe avant de supprimer

    await this.prisma.user.delete({
      where: { id: id },
    });

    // Il est courant de ne rien retourner ou de retourner un message de succès
    return { message: `User with ID "${id}" successfully deleted.` };
  }

  // 👇 AJOUTER CETTE NOUVELLE MÉTHODE 👇
  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneWithPermissions(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }
}
