import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('bootstrap');

  // Helmet to set secure HTTP headers
  app.use(helmet());

  // Init Sentry (optional) if SENTRY_DSN provided
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    app.use((req: any, res: any, next: any) => {
      (res as any).sentry = Sentry;
      next();
    });
  }

  // Cookie parser to read cookies (refresh token cookie)
  app.use(cookieParser());

  // Apply a basic rate limiter (express-rate-limit) to protect endpoints from abuse
  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
      max: Number(process.env.RATE_LIMIT_MAX) || 60, // limit each IP to 60 requests per windowMs
    }),
  );

  // CORS origins can be provided via env var CORS_ORIGINS (comma separated).
  // Automatically include common hosting envs when available (VERCEL_URL, NEXT_PUBLIC_URL)
  const envOrigins = process.env.CORS_ORIGINS;
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Build origin list and include hosting/runtime hints if present
  const originsFromEnv = envOrigins ? envOrigins.split(',').map(s => s.trim()) : defaultOrigins;

  // If running on Vercel, VERCEL_URL contains the deployment hostname (e.g. my-app.vercel.app)
  if (process.env.VERCEL_URL) {
    originsFromEnv.push(`https://${process.env.VERCEL_URL}`);
  }

  // If front-end publishes its public URL via NEXT_PUBLIC_URL, include it
  if (process.env.NEXT_PUBLIC_URL) {
    originsFromEnv.push(process.env.NEXT_PUBLIC_URL);
  }

  // Deduplicate and trim
  const origins = Array.from(new Set(originsFromEnv.map(s => s.trim()).filter(Boolean)));
  logger.log(`CORS whitelist: ${origins.join(', ')}`);

  app.enableCors({
    origin: function (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) {
      // Allow non-browser requests (e.g., curl, server-to-server) where origin is undefined
      if (!origin) return callback(null, true);
      if (origins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT || 3001); // Port 3001 pour correspondre au proxy frontend
}
bootstrap();