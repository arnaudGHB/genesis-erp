import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // <-- 1. IMPORTER

@Module({
  imports: [PrismaModule], // <-- 2. AJOUTER ICI
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}