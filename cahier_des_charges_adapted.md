## Cahier des charges — Version adaptée à notre stack (Genesis Core)

Version : 1.0-adaptée
Date : 26 Octobre 2025
Auteur : Audit BI & Stack (livrable automatique)

Objectif
--------
Relire et adapter le cahier des charges original pour qu'il soit immédiatement actionnable par l'équipe technique en place (stack observée dans le repo) :
- Frontend : Next.js (App Router, React 18), TypeScript, TailwindCSS, shadcn/ui
- Backend : NestJS (v11), TypeScript, Prisma v6.x, PostgreSQL (Neon), Redis, BullMQ

Cette version met l'accent sur : API contractuelles, modèles Prisma (extraits), pipeline BI minimal à mettre en place, sécurité/auth (refresh-token rotation, HttpOnly cookie), migration des refresh tokens, tests et CI, et plan d'implémentation pragmatique.

Résumé exécutif (nouveautés)
---------------------------
- Alignement de toutes les recommandations techniques sur les versions et conventions trouvées dans le dépôt (NestJS v11, Prisma v6.x, Next App Router). 
- Ajout d'API contracts REST clairs (endpoints + schéma JSON d'entrée/sortie) pour les flows critiques : auth, produits, stocks, POS, commandes, transferts.
- Ajout d'extraits Prisma (User, RefreshToken, Product, Stock, Order, StockTransfer) prêts à intégrer dans `schema.prisma`.
- Spécification BI : event bus (Redis/BullMQ) + warehouse (Postgres schema / optional BigQuery), tables ODS and Marts, matérialisées et jobs dbt (ou SQL views) pour KPI.
- Propositions concrètes de migrations (SQL helper existant + steps zero-downtime) et tests d'intégration recommandés.

1. Contract API — endpoints critiques (REST)
------------------------------------------------
Notes générales :
- Tous les endpoints REST renvoient des responses uniformes : { success: boolean, data?: any, error?: { code:string, message:string } }
- Auth : cookies Secure, HttpOnly pour refresh token; access token court (in-memory in frontend) retourné dans response body when login; refresh endpoint rotates token and sets cookie.

Auth
- POST /auth/login
  - body: { email: string, password: string }
  - success 200: { success:true, data: { accessToken?: string, user: { id,name,email,roles[] } } } and Set-Cookie: refresh_token=HttpOnly; Secure
- POST /auth/refresh
  - cookies: refresh_token
  - success 200: { success:true, data: { accessToken?: string, rotated?: true, user?: { id,... } } } and Set-Cookie rotated refresh_token
- POST /auth/logout
  - cookies: refresh_token
  - success 200: { success:true }
- GET /auth/profile
  - auth via accessToken header (Bearer) or session after refresh flow
  - success 200: { success:true, data: { user } }

Products & Catalog
- GET /api/products?search=&page=&perPage=
- GET /api/products/:id
- POST /api/products (admin)
- PUT /api/products/:id (admin)
- DELETE /api/products/:id (admin)

Stocks
- GET /api/stocks?pdvId=&productId=
- POST /api/stocks/adjust (body: { pdvId, productId, delta, reason })
- POST /api/stocks/transfer (body: { fromPdv, toPdv, items:[{productId, qty}] }) -> creates StockTransfer record

Orders / POS
- POST /api/orders (body: { pdvId, customerId?, items:[{productId,qty,price}], payments:[{method,amount,meta}] })
- GET /api/orders/:id
- POST /api/orders/:id/return

Reporting & BI ingest
- POST /api/events (internal) — minimal event sink for domain events (sale.created, stock.adjusted, transfer.created). Prefer event bus (BullMQ) but keep HTTP fallback.

2. Extraits Prisma (suggestions)
---------------------------------
Add these model snippets under `prisma/schema.prisma` — adapt field names/types to existing schema.

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hashed
  roles     String[] @default(["USER"])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id         String   @id @default(cuid())
  tokenHash  String   @unique
  ip         String?
  userAgent  String?
  expiresAt  DateTime
  revoked    Boolean  @default(false)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
}

model Product {
  id          String  @id @default(cuid())
  sku         String? @unique
  title       String
  isbn        String?
  priceCents  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Stock {
  id        String  @id @default(cuid())
  pdvId     String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  qty       Int
  updatedAt DateTime @updatedAt
}

model Order {
  id         String   @id @default(cuid())
  pdvId      String
  customerId String?
  totalCents Int
  status     String   @default("pending")
  lines      Json
  createdAt  DateTime @default(now())
}

model StockTransfer {
  id         String   @id @default(cuid())
  fromPdv    String
  toPdv      String
  items      Json
  status     String   @default("pending")
  createdAt  DateTime @default(now())
}

3. BI & Data pipeline (pragmatique)
----------------------------------
But : Start small. Two layers to ship quickly :
- ODS (operational schema) : keep transactional Postgres as source-of-truth; add an event table (events) and/or stream domain events to Redis/BullMQ.
- Warehouse / Reporting schema : nightly ETL (or near-real-time using small jobs) that aggregates into marts: sales_fact, product_dim, pdv_dim, date_dim, customer_dim.

Concrete minimal pipeline:
1) When order is created -> push event to BullMQ queue `events:domain` (sale.created) with payload (orderId, pdvId, items, totals, timestamp).
2) Worker consumes events, writes to a `reporting.sales_fact` table in reporting DB (can be same Postgres but different schema) and updates materialized views for KPIs.
3) Daily job (cron) rebuilds key aggregates and refreshes materialized views used by dashboards.

Metrics to capture (initial)
- Daily Sales (by PDV, by product, by list/class)
- Stock turnover (days of inventory)
- Return rates (post-rentrée)
- Revenue per customer segment (RFM)
- Forecast error for IA models (tracking)

Tools & recommendations
- Use Redis + BullMQ (already in repo) for events/queues.
- For analytics transform layer prefer dbt if you later move to a cloud DW; until then keep SQL transforms as migration scripts/materialized views.
- Expose metrics to Power BI by creating a read-only reporting DB user and stable materialized views / API endpoints.

4. Auth & Security — concrete (align with recent changes)
-------------------------------------------------------
- Use access tokens short lived (e.g. 5–15 min) kept in frontend memory. No localStorage. Refresh token in Secure, HttpOnly, SameSite=Lax cookie. Refresh token stored in DB as SHA-256 tokenHash.
- Rotate refresh token on each use: when /auth/refresh is called, validate tokenHash, create new refresh token, store new hash, mark old token as revoked (or expire), send new cookie.
- Limit concurrent active refresh tokens per user (configurable via REFRESH_TOKEN_MAX env). Revoke oldest when exceeding.
- Audit fields on RefreshToken: ip, userAgent, createdAt, expiresAt, revokedById (optional).
- Rate-limit auth endpoints (login, refresh) with an exponential backoff policy and IP-based blocking for brute-force.

Migration note (you already have helper SQL):
- Use `backend/prisma/data-migration/convert_tokens_to_hash.sql` to migrate plaintext tokens to tokenHash in a maintenance window. Ensure tests and backups before running.

5. Testing, CI/CD & quality gates
----------------------------------
- Tests: unit tests (Jest) for services, integration tests (Supertest) for controllers, E2E (Playwright) for critical flows (login → create order → sync stock).
- Coverage target: 70–80% for backend modules in Phase 1; aim 80% across critical modules.
- Linting/pre-commit: ESLint + Prettier + Husky hooks to run `npm test -- -t 'fast'` and `npm run lint` on staged changes.
- CI: GitHub Actions with matrix jobs (node 18/20), steps: install deps, generate prisma client, run lint, run unit tests, run minimal integration tests (use docker-compose for Postgres/Redis or use Testcontainers where available), publish artifact.

6. Migration & rollout plan (zero-downtime guidance)
---------------------------------------------------
1) Prepare migration in a branch; add feature flag for token rotation behavior if needed.
2) Deploy backend in canary with migrations run using `prisma migrate deploy` on new instance; keep old instance running to accept traffic if possible.
3) Run data-migration script to convert tokens (with DB backup), in a maintenance window or via transactional migration.
4) Deploy new backend which reads tokenHash and respects rotation. Monitor auth logs and errors.

7. Acceptance criteria (MVP)
---------------------------
- Admin can create users and assign roles; MFA optional.
- POS can create an order offline and sync within 48h without data loss or over-selling for simple conflict cases.
- Core entities exist: Product, Stock, Order, User; API endpoints above implemented and tested.
- Refresh/token flow implemented with HttpOnly cookie and rotation; tests for rotation/migration pass.
- Basic BI pipeline ingests domain events and produces daily sales fact and a dashboard for top KPIs.

8. Quick implementation checklist for first sprint (2 weeks)
--------------------------------------------------------
- CONF-001: Implement User model, auth module (login/refresh/logout/profile) + tests.
- STK-001/STK-003: Product + Stock models + endpoints; implement simple stock decrement on order creation.
- POS-001/POS-002/POS-004: Order creation API + payments placeholder (simulate MoMo). Offline queue skeleton (BullMQ worker) to accept events.
- BI: events queue + simple worker that writes to reporting.sales_fact table; basic Grafana dashboard prototype.
- CI: add GitHub Action that runs lint and unit tests.

9. Files créés / modifiés recommandés
-------------------------------------
- `prisma/schema.prisma` : add models above or merge with existing.
- `backend/src/auth/*` : ensure refresh rotation & cookie logic implemented as per auth.service in repo.
- `backend/prisma/data-migration/convert_tokens_to_hash.sql` : run in migration step.
- `backend/src/events/worker.ts` : worker to consume events and write reporting rows.

10. Prochaines étapes immédiates (ce que je peux faire pour vous maintenant)
---------------------------------------------------------------------------
1) Commiter ce fichier d'adaptation en repo (je peux le créer et proposer le commit/PR).  
2) Générer un patch Prisma (schema snippet) et tests d'intégration minimal pour le flow auth+refresh.  
3) Générer un board de tâches (Jira/CSV) listant les 15 premières stories P0 découpées en tâches techniques.  

Fichier sauvegardé ici : `./cahier_des_charges_adapted.md` (repo root). Relisez et dites si vous voulez :
- que je crée automatiquement la PR Git avec ce fichier, ou
- que je génère les specs OpenAPI (YAML) pour les endpoints listés, ou
- que je crée les migrations Prisma correspondantes.

---
Fin de l'adaptation.
