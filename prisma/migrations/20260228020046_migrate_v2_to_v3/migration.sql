-- ============================================================
-- MIGRATION: V2 → V3 Schema Transformation  
-- ============================================================

-- STEP 1: Create new V3 Enums
DROP TYPE IF EXISTS "blood_bag_status_enum" CASCADE;
CREATE TYPE "blood_bag_status_enum" AS ENUM ('AVAILABLE','RESERVED','USED','EXPIRED','DISCARDED','TRANSFERRED');

DROP TYPE IF EXISTS "movement_type_enum" CASCADE;
CREATE TYPE "movement_type_enum" AS ENUM ('ENTRY_DONATION','ENTRY_TRANSFER_IN','ENTRY_PURCHASE','EXIT_TRANSFUSION','EXIT_TRANSFER_OUT','EXIT_DISCARD','EXIT_EXPIRED','EXIT_RESEARCH','ADJUSTMENT');

DROP TYPE IF EXISTS "user_role_enum" CASCADE;
CREATE TYPE "user_role_enum" AS ENUM ('ADMIN','MANAGER','TECHNICIAN','DOCTOR','NURSE','AUDITOR');

DROP TYPE IF EXISTS "alert_type_enum" CASCADE;
CREATE TYPE "alert_type_enum" AS ENUM ('LOW_STOCK','EXPIRING_SOON','EXPIRED','CRITICAL_STOCK');

-- STEP 2: Backup V2 data
CREATE TABLE "_v2_stock_backup" AS SELECT * FROM "stock";
CREATE TABLE "_v2_movement_backup" AS SELECT * FROM "bloodstock_movement";
CREATE TABLE "_v2_batch_backup" AS SELECT * FROM "batch";

-- STEP 3: Create Company table
CREATE TABLE "company" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "cnpj" VARCHAR(18) NOT NULL UNIQUE,
  "address" TEXT,
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "city" VARCHAR(100),
  "state" VARCHAR(2),
  "zip_code" VARCHAR(10),
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "company_cnpj_idx" ON "company"("cnpj");
INSERT INTO "company" ("name", "cnpj") VALUES ('Default', '00.000.000/0000-00') ON CONFLICT ("cnpj") DO NOTHING;

-- STEP 4: Create User table
CREATE TABLE "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "role" "user_role_enum" NOT NULL,
  "cpf" VARCHAR(14),
  "phone" VARCHAR(20),
  "is_active" BOOLEAN DEFAULT true,
  "last_login" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "user_company_id_idx" ON "user"("company_id");
INSERT INTO "user" ("company_id", "name", "email", "password", "role") 
SELECT "id", 'System', 'system@local', 'SYS', 'ADMIN' FROM "company" LIMIT 1 
ON CONFLICT ("email") DO NOTHING;

-- STEP 5: Migrate & recreate Batch
CREATE TABLE "batch_v3" AS
SELECT 
  b."id",
  (SELECT "id" FROM "company" LIMIT 1) AS "company_id",
  b."code",
  b."blood_type",
  b."created_at" AS "received_at",
  b."created_at" + INTERVAL '30 days' AS "expires_at",
  NULL::VARCHAR(255) AS "donor_reference",
  NULL::VARCHAR(255) AS "source_location",
  NULL::TEXT AS "notes",
  b."created_at",
  b."updated_at"
FROM "_v2_batch_backup" b;

ALTER TABLE "batch_v3" ADD PRIMARY KEY ("id");
ALTER TABLE "batch_v3" ADD CONSTRAINT "batch_v3_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE;
ALTER TABLE "batch_v3" ADD CONSTRAINT "batch_v3_unique_code_company" UNIQUE("company_id", "code");

DROP INDEX IF EXISTS "batch_company_id_code_key" CASCADE;
DROP INDEX IF EXISTS "batch_blood_type_idx" CASCADE;
DROP INDEX IF EXISTS "batch_company_id_idx" CASCADE;
DROP TABLE "batch";
ALTER TABLE "batch_v3" RENAME TO "batch";

CREATE INDEX "batch_company_id_idx" ON "batch"("company_id");
CREATE INDEX "batch_blood_type_idx" ON "batch"("blood_type");
CREATE INDEX "batch_expires_at_idx" ON "batch"("expires_at");
CREATE INDEX "batch_company_blood_type_idx" ON "batch"("company_id", "blood_type");

-- STEP 6: Create BloodBag table
CREATE TABLE "blood_bag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" UUID NOT NULL REFERENCES "batch"("id") ON DELETE CASCADE,
  "bag_code" VARCHAR(100) NOT NULL UNIQUE,
  "blood_type" "BloodType" NOT NULL,
  "volume" INTEGER DEFAULT 450,
  "status" "blood_bag_status_enum" DEFAULT 'AVAILABLE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "reserved_for" UUID,
  "reserved_at" TIMESTAMP(3),
  "reserved_by" UUID,
  "used_at" TIMESTAMP(3),
  "used_by" UUID,
  "used_for" UUID,
  "discarded_at" TIMESTAMP(3),
  "discarded_by" UUID,
  "discard_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "blood_bag_batch_id_idx" ON "blood_bag"("batch_id");
CREATE INDEX "blood_bag_blood_type_idx" ON "blood_bag"("blood_type");
CREATE INDEX "blood_bag_status_idx" ON "blood_bag"("status");
CREATE INDEX "blood_bag_expires_at_idx" ON "blood_bag"("expires_at");
CREATE INDEX "blood_bag_status_expires_at_idx" ON "blood_bag"("status", "expires_at");

-- Populate blood bags from stock
INSERT INTO "blood_bag" ("batch_id", "bag_code", "blood_type", "volume", "expires_at", "created_at")
SELECT
  b."id",
  'BAG-' || s."id" || '-' || ROW_NUMBER() OVER (PARTITION BY s."id" ORDER BY s."id")::TEXT,
  s."blood_type",
  450,
  s."created_at" + INTERVAL '30 days',
  s."created_at"
FROM "_v2_stock_backup" s
JOIN "batch" b ON b."blood_type" = s."blood_type" AND b."company_id" = (SELECT "id" FROM "company" LIMIT 1)
WHERE s."quantity" > 0;

-- STEP 7: Create Movement table
CREATE TABLE "movement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_bag_id" UUID REFERENCES "blood_bag"("id") ON DELETE SET NULL,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "type" "movement_type_enum" NOT NULL,
  "blood_type" "BloodType" NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "origin" VARCHAR(255),
  "destination" VARCHAR(255),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "movement_company_id_idx" ON "movement"("company_id");
CREATE INDEX "movement_type_idx" ON "movement"("type");
CREATE INDEX "movement_blood_type_idx" ON "movement"("blood_type");

-- Populate movements 
INSERT INTO "movement" ("company_id", "user_id", "type", "blood_type", "quantity", "notes", "created_at")
SELECT
  (SELECT "id" FROM "company" LIMIT 1),
  (SELECT "id" FROM "user" LIMIT 1),
  CASE WHEN m."movement" > 0 THEN 'ENTRY_DONATION'::movement_type_enum ELSE 'EXIT_TRANSFUSION'::movement_type_enum END,
  'A_POS'::"BloodType",
  ABS(m."movement"),
  m."notes",
  m."created_at"
FROM "_v2_movement_backup" m;

-- STEP 8: Create StockView
CREATE TABLE "stock_view" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_type" "BloodType" NOT NULL,
  "available_count" INTEGER DEFAULT 0,
  "reserved_count" INTEGER DEFAULT 0,
  "used_count" INTEGER DEFAULT 0,
  "expired_count" INTEGER DEFAULT 0,
  "discarded_count" INTEGER DEFAULT 0,
  "expiring_soon_count" INTEGER DEFAULT 0,
  "total_volume" INTEGER DEFAULT 0,
  "available_volume" INTEGER DEFAULT 0,
  "last_updated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "oldest_expiration_date" TIMESTAMP(3),
  CONSTRAINT "stock_view_unique_company_blood_type" UNIQUE("company_id", "blood_type")
);

INSERT INTO "stock_view" ("company_id", "blood_type", "available_count", "total_volume", "available_volume")
SELECT
  b."company_id",
  bb."blood_type",
  COUNT(*) FILTER (WHERE bb."status" = 'AVAILABLE'),
  SUM(bb."volume"),
  SUM(bb."volume") FILTER (WHERE bb."status" = 'AVAILABLE')
FROM "blood_bag" bb
JOIN "batch" b ON bb."batch_id" = b."id"
GROUP BY b."company_id", bb."blood_type";

-- STEP 9: Create StockAlert
CREATE TABLE "stock_alert" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_type" "BloodType" NOT NULL,
  "alert_type" "alert_type_enum" NOT NULL,
  "severity" VARCHAR(20) NOT NULL,
  "message" TEXT NOT NULL,
  "threshold" INTEGER,
  "current_value" INTEGER,
  "is_resolved" BOOLEAN DEFAULT false,
  "resolved_at" TIMESTAMP(3),
  "resolved_by" UUID,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- STEP 10: Create EventLog
CREATE TABLE "event_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "aggregate_id" UUID NOT NULL,
  "aggregate_type" VARCHAR(50) NOT NULL,
  "event_type" VARCHAR(100) NOT NULL,
  "event_data" JSONB NOT NULL,
  "user_id" UUID,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "event_log_aggregate_id_idx" ON "event_log"("aggregate_id");

-- STEP 11: Drop V2 tables
DROP TABLE "stock" CASCADE;
DROP TABLE "bloodstock_movement" CASCADE;
