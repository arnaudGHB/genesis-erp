import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { StocksModule } from './stocks/stocks.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ProductsModule, StocksModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}