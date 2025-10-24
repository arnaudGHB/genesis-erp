import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const whitelist = [
    'http://localhost:3000', // Développement local
    'http://localhost:3001', // Développement local
    'http://localhost:3002', // Développement local
    'http://localhost:3003', // Ports de test
    'https://genesis-erp-frontend-fxpnu1ro1-arnaudvcls-projects.vercel.app' // Frontend Vercel déployé
  ];

  app.enableCors({
    origin: function (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT || 3000); // Port flexible
}
bootstrap();