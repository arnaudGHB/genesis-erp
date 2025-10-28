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
  // CORS Configuration - Best practice: strict in PROD, permissive in DEV
  // =========================================================================
  const isDev = process.env.NODE_ENV !== 'production';
  const devMode = process.env.DEV_MODE === 'true';
  
  // En mode DEV ou DEV_MODE, autoriser toutes les origines localhost/127.0.0.1
  if (isDev || devMode) {
    logger.log('🔓 CORS: Mode développement - origines localhost autorisées');
    app.enableCors({
      origin: (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
        // Autoriser requêtes sans origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        
        // Autoriser localhost et 127.0.0.1 sur tous les ports
        if (origin.startsWith('http://localhost:') || 
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://192.168.')) {
          return callback(null, true);
        }
        
        // Bloquer autres origines même en DEV pour la sécurité
        logger.warn(`⚠️  CORS bloqué: ${origin}`);
        callback(null, false);
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
      exposedHeaders: ['WWW-Authenticate'],
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24h cache pour preflight
    });
  } else {
    // Mode PRODUCTION: whitelist stricte depuis CORS_ORIGINS
    const envOrigins = process.env.CORS_ORIGINS;
    
    // En mode strict sans DEV_MODE, exiger CORS_ORIGINS
    const originsFromEnv = envOrigins ? envOrigins.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // Ajouter VERCEL_URL si disponible
    if (process.env.VERCEL_URL) {
      originsFromEnv.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Ajouter NEXT_PUBLIC_URL si disponible
    if (process.env.NEXT_PUBLIC_URL) {
      originsFromEnv.push(process.env.NEXT_PUBLIC_URL);
    }

    const origins = Array.from(new Set(originsFromEnv));
    
    if (origins.length === 0) {
      logger.warn('⚠️  CORS_ORIGINS vide - autoriser toutes origines en développement');
      // Fallback: autoriser toutes origines si aucune n'est configurée (dev uniquement)
      app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
        exposedHeaders: ['WWW-Authenticate'],
        optionsSuccessStatus: 204,
        maxAge: 86400,
      });
    } else {
      logger.log(`🔒 CORS: Mode production - whitelist: ${origins.join(', ')}`);
      app.enableCors({
        origin: (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
          if (!origin) return callback(null, true);
          
          if (origins.includes(origin)) {
            callback(null, true);
          } else {
            logger.warn(`❌ CORS bloqué en production: ${origin}`);
            callback(null, false);
          }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
        exposedHeaders: ['WWW-Authenticate'],
        optionsSuccessStatus: 204,
        maxAge: 86400,
      });
    }
  }

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