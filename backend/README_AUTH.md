# Authentication & Session Design (Genesis ERP)

This document summarizes the auth changes made to the backend and how to operate/test them.

## Summary
- JWT-based access tokens (short-lived) and JWT refresh tokens (longer-lived).
- Refresh tokens are stored in DB (`RefreshToken` model) and set as HttpOnly cookies.
- Refresh tokens are rotated on use (atomic revoke old + create new inside a transaction).
- Audit fields (ip, userAgent) recorded on refresh token creation.
- Limit active refresh tokens per user (default 5) — oldest tokens revoked when limit reached.
- Security middleware: Helmet, cookie-parser and express-rate-limit added.
- Role-based guard (`Roles` decorator + `RolesGuard`) for protected endpoints.

## Important files
- `src/auth/auth.module.ts` — JWT module config reading env variables.
- `src/auth/auth.service.ts` — token generation + DB persistence + cleanup.
- `src/auth/auth.controller.ts` — `/auth/login`, `/auth/refresh` (rotation), `/auth/logout`, `/auth/profile`.
- `prisma/schema.prisma` — includes `RefreshToken` model with `ip` and `userAgent`.
 - NOTE: refresh tokens are now stored as a SHA-256 hash in the DB (`RefreshToken.tokenHash`).
    The code hashes the token before persisting and looks up by hash on refresh/logout. This means
    you'll need to run a Prisma migration locally to apply the schema change (see below).
- `src/main.ts` — Helmet, cookie-parser, rate-limiter, CORS config.
- `src/auth/roles.decorator.ts` and `src/auth/roles.guard.ts` — role-based access.

## Env variables (important)
- `JWT_SECRET` (required)
- `JWT_EXPIRES_IN` (e.g. `60m`)
- `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`)
- `REFRESH_TOKEN_EXPIRES_MS` (ms TTL for DB expiresAt, default 7 days)
- `REFRESH_TOKEN_MAX` (max active refresh tokens per user, default 5)
- `CORS_ORIGINS` (comma separated frontend origins)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` (rate limiter)

## How refresh rotation works
1. Client sends `POST /auth/refresh` with the HttpOnly `refresh_token` cookie.
2. Server verifies the token, then starts a transaction:
   - ensures the DB record exists and is not revoked or expired
   - marks the old token as `revoked` (updateMany)
   - creates a new refresh token record and returns it in a new cookie
3. Server issues a new access token in the response body.

## How to test locally
1. Apply Prisma migrations: `npx prisma migrate dev --name add_refresh_tokens`
   (if you are migrating from an older schema that stored plaintext tokens, consider a data
   migration or rotate active sessions after deploying this change)
2. Generate Prisma client: `npx prisma generate`
    If you already have existing plaintext refresh tokens in the DB, a helper SQL script is provided at `prisma/data-migration/convert_tokens_to_hash.sql`.
    It uses PostgreSQL `pgcrypto` digest(...) to compute SHA-256 hex values and populate `tokenHash`.
    WARNING: run in a maintenance window and test on a copy of your DB first. The script is a convenience; if `pgcrypto` is not available you should write a small Node/Prisma script to compute hashes and persist them.
3. Start backend: `npm run start:dev`
4. Start frontend and login to test cookie behavior.

## Tests
- A unit test for `AuthService.signIn` is provided in `src/auth/auth.service.spec.ts`.

## Next improvements
- Add integration tests (Supertest) covering login/refresh/logout flows.
- Add structured logging (winston) and Sentry full integration.
- Add detection for token reuse (replay detection) and forced user logout.

