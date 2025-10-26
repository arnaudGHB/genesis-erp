-- Data migration helper: convert existing plaintext refresh tokens to tokenHash (SHA-256 hex)
-- WARNING: Run in maintenance window. Test thoroughly on a staging copy first.
-- This script expects the pgcrypto extension to be available. If it's not available in your DB, use a safe script or rotate sessions instead.

-- 1) Add tokenHash column (if not already added by Prisma migration)
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;

-- 2) Populate tokenHash from existing token (use encode(digest(...), 'hex'))
-- Only populate where token is not null and tokenHash is null to avoid overwriting manual data.
DO $$
BEGIN
  -- Ensure pgcrypto is present (may require superuser privileges)
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgcrypto extension could not be created or is unavailable; you may need to create tokenHash via an application script.';
  END;

  UPDATE "RefreshToken"
  SET "tokenHash" = encode(digest("token"::bytea, 'sha256'), 'hex')
  WHERE "token" IS NOT NULL AND ("tokenHash" IS NULL OR "tokenHash" = '');
END$$;

-- 3) OPTIONAL: add unique index on tokenHash (may fail if duplicates)
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_tokenhash ON "RefreshToken" ("tokenHash");

-- 4) OPTIONAL: once verified, drop plaintext token column
-- ALTER TABLE "RefreshToken" DROP COLUMN IF EXISTS "token";

-- Notes:
-- - If pgcrypto is not available, you can write a small Node script that reads tokens and writes hashes back using the Prisma Client.
-- - After running this script, run `npx prisma generate` and update code to use tokenHash (already done in code).
-- - Always backup your DB before running data migrations.
