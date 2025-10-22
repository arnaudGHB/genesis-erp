import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Permet d'injecter PrismaService dans d'autres modules
})
export class PrismaModule {}