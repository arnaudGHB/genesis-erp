# Architecture — genesis-erp

Ce document donne une vue d'ensemble actionnable du projet "genesis-erp" (frontend Next.js + backend NestJS + Prisma/Postgres). Il couvre l'architecture, le flux d'auth, les contrats API clés, les variables d'environnement critiques, checklist de déploiement et étapes de diagnostic pour le comportement observé en production (connexion OK puis redirection vers /login).

## 1. Vue d'ensemble

- Monorepo with two main apps:
  - frontend/: Next.js (App Router, TypeScript, Tailwind, shadcn/ui)
  - backend/: NestJS (TypeScript), Prisma ORM, PostgreSQL
- Auth design:
  - Access token (JWT) stocké en mémoire côté client (court TTL)
  - Refresh token (JWT) stocké côté serveur dans un cookie HttpOnly Secure (long TTL)
  - Refresh tokens persisted in DB as SHA‑256 hashes (RefreshToken.tokenHash)
  - Rotation: refresh endpoint issues new pair and marks old refresh token revoked

## 2. Composants et responsabilités

- Frontend (frontend/)
  - axios instance: `frontend/src/lib/api.ts` — baseURL from NEXT_PUBLIC_API_URL, withCredentials: true
  - AuthContext (`frontend/src/contexts/AuthContext.tsx`) : garde l'access token en mémoire, appelle POST /auth/refresh on mount, fetches /auth/profile
  - Dashboard layout: `frontend/src/app/(dashboard)/layout.tsx` (sidebar, menu basé sur permissions)

- Backend (backend/)
  - NestJS modules: Auth, Users, Products, Stocks, PrismaModule
  - Auth controller: /auth/login, /auth/refresh, /auth/logout, /auth/profile, /auth/debug (debug endpoint, disabled by default)
  - main.ts: app bootstrap — helmet, rate-limiter, cookie-parser, CORS configured from env
  - Prisma schema: contains User, Role, Permission, RefreshToken (tokenHash, ip, userAgent, revoked, expiresAt)

- Database
  - PostgreSQL via Prisma
  - RefreshToken entries store tokenHash (sha256) — migration helper exists at `backend/prisma/data-migration/convert_tokens_to_hash.sql`

## 3. Flux d'authentification (contract résumé)

1. Login (POST /auth/login)
   - Input: { email, password }
   - Behavior: validate credentials, create accessToken (short TTL) and refreshToken (long TTL), set refreshToken in HttpOnly Secure cookie, return accessToken in response body
   - Cookie settings (production expected): Secure, HttpOnly, SameSite=None (to allow cross-site cookies from Vercel), Path=/, Expires

2. Refresh (POST /auth/refresh)
   - Called with cookie (HttpOnly)
   - Behavior: validate refresh token (compare hashed value), create new accessToken + new refreshToken, set cookie with new refresh token (rotation), persist audit data (ip, userAgent), revoke old token

3. Profile (GET /auth/profile)
   - Protected endpoint — returns user profile and permissions
   - Client calls this on app mount after receiving access token (or after refresh)

Failure mode observed in prod: login succeeds (cookie set) but frontend receives no usable profile or profile fetch returns 401/Network/CORS → AuthContext runs logout() → redirect to /login.

## 4. Problèmes courants et checklist de diagnostic (prioritaire pour le bug de prod)

1. CORS / Origin
   - Backend must allow the exact origin used by Vercel preview/domains. Configure `CORS_ORIGINS` env or rely on `VERCEL_URL`/`NEXT_PUBLIC_URL` being available at backend startup.
   - Inspect backend logs for "Blocked CORS origin" warnings (déjà vu dans les logs).

2. Cookies cross-site
   - Cookie must be set with: Secure=true, HttpOnly=true, SameSite=None when frontend is on a different origin.
   - If SameSite is `lax` or `strict`, the browser may not send the cookie on cross-site requests.
   - Ensure HTTPS on frontend (Vercel) and Secure=true.

3. axios withCredentials
   - Frontend axios instance must use withCredentials: true (already configured).
   - Ensure fetch/xhr calls include credentials and Authorization header set when accessToken in memory.

4. Runtime envs & URLs
   - Frontend must have NEXT_PUBLIC_API_URL pointing to backend (e.g. https://api.example.com).
   - Backend CORS_ORIGINS should include frontend origin(s).

5. Inspect in browser
   - Network tab: after login, inspect Set-Cookie header on login response; verify cookie flags (Secure, HttpOnly, SameSite)
   - Inspect subsequent requests to /auth/refresh and /auth/profile: is cookie sent? what are request/response codes and CORS errors?

6. Use `/auth/debug`
   - If allowed in your deployment (ALLOW_DEBUG=true or in preview environment), call GET /auth/debug to dump non-sensitive request metadata: origin, cookie keys, presence of refresh cookie, ip, userAgent.

## 5. Variables d'environnement critiques

Frontend (Vercel) — set in Vercel project settings
- NEXT_PUBLIC_API_URL = https://<your-backend-domain>

Backend (Render or similar)
- DATABASE_URL
- JWT_ACCESS_TOKEN_SECRET
- JWT_REFRESH_TOKEN_SECRET
- CORS_ORIGINS (comma-separated list). Alternativement ensure VERCEL_URL / NEXT_PUBLIC_URL env vars are present at startup for runtime detection.
- COOKIE_SAMESITE (optional) — defaults to 'none' in production in current code
- ALLOW_DEBUG (optional) — set to true temporarily for /auth/debug
- REFRESH_TOKEN_MAX (optional) — limit concurrent sessions

## 6. Contrats d'API essentiels (quick reference)

- POST /auth/login
  - body: { email, password }
  - response: { accessToken, user: { id, email, roles... } }
  - side-effect: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite

- POST /auth/refresh
  - Cookie: refreshToken
  - response: { accessToken }
  - side-effect: rotates refresh token cookie

- GET /auth/profile
  - header: Authorization: Bearer <accessToken>
  - response: { id, email, permissions, roles }

- POST /auth/logout
  - Cookie: refreshToken
  - response: 200
  - side-effect: clear cookie and revoke token

- GET /auth/debug (dev-only)
  - Returns: { origin, cookieKeys, hasRefreshCookie, ip, userAgent, corsOrigins } — non-sensitive

## 7. Migration & data considerations

- If your DB earlier stored raw refresh tokens (plaintext), run the provided SQL helper to compute tokenHash from stored tokens before switching to the hashed flow:
  - Path: backend/prisma/data-migration/convert_tokens_to_hash.sql
  - Advice: run in a maintenance window and backup DB.

## 8. Tests & qualité

- Unit tests: backend uses Jest (existing spec files in src/*/*.spec.ts)
- E2E: use Supertest / Playwright for the main flows (login → refresh → profile)
- Recommended tests to add immediately:
  - E2E: login on production-like env (staging) and assert cookie flags and profile fetch success
  - Integration: refresh token rotation and revocation logic

## 9. Operational playbook to reproduce & fix the dashboard redirect bug

1. On deployed backend: verify environment contains the production frontend origin in CORS_ORIGINS or that VERCEL_URL / NEXT_PUBLIC_URL are available at startup.
2. Confirm backend is using SameSite=None for cookies (or set COOKIE_SAMESITE=none) and Secure=true.
3. Redeploy backend (so it picks up env changes and rebuilds the CORS whitelist).
4. On frontend (Vercel): set NEXT_PUBLIC_API_URL to the backend URL and redeploy.
5. In browser (incognito):
   - Open DevTools → Network
   - Perform login and inspect the login response headers (Set-Cookie)
   - Confirm cookie flags: Secure, HttpOnly, SameSite=None
   - Check that subsequent GET /auth/profile sends the cookie (look under Request Headers → Cookie)
6. If profile fetch fails or cookie not present, enable ALLOW_DEBUG=true and GET /auth/debug to capture what backend sees.

## 10. Recommended next steps (short-term)

- Add these checks in your deployment pipeline/README for production readiness:
  - Ensure backend CORS list includes the production frontend origin.
  - Ensure cookie policy: SameSite=None in prod; Secure only on HTTPS.
  - Provide a small health-check endpoint that returns CORS whitelist and a sample Set-Cookie header string for quick verification (the repo already includes /auth/debug).
- Add an automated E2E pipeline that runs a login → profile flow using the deployed staging URLs and fails if cookies are not accepted or profile returns 401.

## 11. Annexes / Useful commands

- Local dev (from repo root):
  - Start backend: cd backend; npm install; npm run start:dev
  - Start frontend: cd frontend; npm install; npm run dev
- Prisma migrations: cd backend; npx prisma migrate dev --name <name>

---

Résumé Court
- Le comportement observé (login OK → redirect to login) est typique d'un cookie non envoyé ou d'un échec CORS lors du refresh/profile call.
- Vérifiez CORS_ORIGINS / VERCEL_URL / NEXT_PUBLIC_URL and COOKIE_SAMESITE (None) + Secure + withCredentials in axios.
- Utilisez `/auth/debug` (ALLOW_DEBUG=true) + Browser DevTools → Network/Cookies pour capturer la preuve et me la partager; je proposerai la correction précise ensuite.

