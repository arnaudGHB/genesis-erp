# STB - CONF-001 - Gestion Utilisateurs, Rôles, MFA & Logs
API Endpoints:
- POST /api/admin/users
  Request: { "email","name","role","password" }
  Response: 201 { "id","email" }

- GET /api/admin/users
  Query: ?role=&page=&size=
  Response: 200 [{ user }]

- PUT /api/admin/users/{id}
- DELETE /api/admin/users/{id}
- POST /api/auth/login  -> returns JWT
- POST /api/auth/mfa/setup -> { secret, qr }
- POST /api/auth/mfa/verify -> { token }

DB changes (Prisma sample):
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  role       Role
  password   String
  mfaSecret  String?
  createdAt  DateTime @default(now())
}

enum Role { ADMIN MANAGER CAISSIER VENDEUR COMPTA }

model AuditLog {
  id        String @id @default(cuid())
  actorId   String
  action    String
  target    String?
  payload   Json?
  createdAt DateTime @default(now())
}

Security:
- Password hashing: bcrypt
- JWT RS256 with expiry (access 15m, refresh 30d)
- RBAC middleware (server-side guard)
- Rate limit login attempts (brute force protection)

Domain model DTOs:
- CreateUserDto, UpdateUserDto, LoginDto, MfaVerifyDto

Tasks (issues):
- TASK-CONF-001-01: Create DB models + migration (1 day)
- TASK-CONF-001-02: Implement UserRepository + unit tests (1.5 day)
- TASK-CONF-001-03: Implement UserService (business rules) + unit tests (1.5 day)
- TASK-CONF-001-04: Implement API controllers + integration tests (2 day)
- TASK-CONF-001-05: Implement RBAC middleware + tests (1 day)
- TASK-CONF-001-06: MFA endpoints + QR generation + integration tests (1.5 day)
- TASK-CONF-001-07: Audit logging pipeline + Sentry hook (0.5 day)
- TASK-CONF-001-08: Frontend admin UI (list/create/edit) + E2E (2 day)
- TASK-CONF-001-09: PR, Review, Merge, Deploy staging (0.5 day)

Tests:
- Unit: repository/service logic
- Integration: endpoints + DB (testcontainers)
- E2E: create user -> login -> enable MFA -> verify

Deployment notes:
- Feature flag: CONF_RBAC (true)
- Rollback: DB migration reversible; disable RBAC by env toggle in emergency