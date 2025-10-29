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

  // Helmet to set secure HTTP headers (configured for web apps with APIs)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable CSP for API-only backend
    }),
  );

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

  // =========================================================================
  // CORS Configuration - Fixed for production deployment
  // =========================================================================
  const isDev = process.env.NODE_ENV !== 'production';
  const devMode = process.env.DEV_MODE === 'true';

  // Build allowed origins list
  const allowedOrigins: string[] = [];

  // Always allow server-to-server requests (no origin)
  // In development, allow localhost
  if (isDev || devMode) {
    logger.log('🔓 CORS: Mode développement - origines localhost autorisées');
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001');
  }

  // In production, use CORS_ORIGINS environment variable
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    const originsFromEnv = envOrigins.split(',').map(s => s.trim()).filter(Boolean);
    allowedOrigins.push(...originsFromEnv);
  }

  // Add Vercel deployment URLs if available
  if (process.env.VERCEL_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NEXT_PUBLIC_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_URL);
  }

  // Remove duplicates
  const uniqueOrigins = Array.from(new Set(allowedOrigins));

  logger.log(`🔒 CORS: Origines autorisées: ${uniqueOrigins.join(', ') || 'aucune'}`);

  // Configure CORS with proper preflight handling
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
      // Allow requests without origin (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (uniqueOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS bloqué: ${origin} (origines autorisées: ${uniqueOrigins.join(', ')})`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['WWW-Authenticate'],
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24h cache for preflight
    preflightContinue: false,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés non décorées
    forbidNonWhitelisted: true, // Lance une erreur si des propriétés non décorées sont présentes
    transform: true, // Transforme automatiquement les payloads
    disableErrorMessages: process.env.NODE_ENV === 'production', // Cache les détails d'erreur en prod
  }));

  // Gestion globale des erreurs non capturées
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  await app.listen(process.env.PORT || 3001); // Port 3001 pour correspondre au proxy frontend
}
bootstrap();