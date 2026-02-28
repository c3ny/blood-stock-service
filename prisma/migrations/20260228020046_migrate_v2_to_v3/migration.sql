-- ============================================================
-- MIGRATION: V2 → V3 Schema Transformation  
-- ============================================================

-- STEP 1: Create new V3 Enums
DROP TYPE IF EXISTS "blood_type_enum" CASCADE;
CREATE TYPE "blood_type_enum" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

DROP TYPE IF EXISTS "blood_bag_status_enum" CASCADE;
CREATE TYPE "blood_bag_status_enum" AS ENUM ('AVAILABLE','RESERVED','USED','EXPIRED','DISCARDED','TRANSFERRED');

DROP TYPE IF EXISTS "movement_type_enum" CASCADE;
CREATE TYPE "movement_type_enum" AS ENUM ('ENTRY_DONATION','ENTRY_TRANSFER_IN','ENTRY_PURCHASE','EXIT_TRANSFUSION','EXIT_TRANSFER_OUT','EXIT_DISCARD','EXIT_EXPIRED','EXIT_RESEARCH','ADJUSTMENT');

DROP TYPE IF EXISTS "user_role_enum" CASCADE;
CREATE TYPE "user_role_enum" AS ENUM ('ADMIN','MANAGER','TECHNICIAN','DOCTOR','NURSE','AUDITOR');

DROP TYPE IF EXISTS "alert_type_enum" CASCADE;
CREATE TYPE "alert_type_enum" AS ENUM ('LOW_STOCK','EXPIRING_SOON','EXPIRED','CRITICAL_STOCK');

-- STEP 2: Backup V2 data (conditional - only if tables exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stock') THEN
    EXECUTE 'CREATE TABLE "_v2_stock_backup" AS SELECT * FROM "stock"';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bloodstock_movement') THEN
    EXECUTE 'CREATE TABLE "_v2_movement_backup" AS SELECT * FROM "bloodstock_movement"';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'batch') THEN
    EXECUTE 'CREATE TABLE "_v2_batch_backup" AS SELECT * FROM "batch"';
  END IF;
END $$;

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

-- STEP 5: Recreate Batch table with V3 structure
DROP TABLE IF EXISTS "batch" CASCADE;

CREATE TABLE "batch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "code" VARCHAR(100) NOT NULL,
  "blood_type" "blood_type_enum" NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "donor_reference" VARCHAR(255),
  "source_location" VARCHAR(255),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "batch_unique_code_company" UNIQUE("company_id", "code")
);

CREATE INDEX "batch_company_id_idx" ON "batch"("company_id");
CREATE INDEX "batch_blood_type_idx" ON "batch"("blood_type");
CREATE INDEX "batch_expires_at_idx" ON "batch"("expires_at");
CREATE INDEX "batch_company_blood_type_idx" ON "batch"("company_id", "blood_type");

-- STEP 6: Create BloodBag table
CREATE TABLE "blood_bag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" UUID NOT NULL REFERENCES "batch"("id") ON DELETE CASCADE,
  "bag_code" VARCHAR(100) NOT NULL UNIQUE,
  "blood_type" "blood_type_enum" NOT NULL,
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

-- STEP 7: Create Movement table
CREATE TABLE "movement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_bag_id" UUID REFERENCES "blood_bag"("id") ON DELETE SET NULL,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "type" "movement_type_enum" NOT NULL,
  "blood_type" "blood_type_enum" NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "origin" VARCHAR(255),
  "destination" VARCHAR(255),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "movement_company_id_idx" ON "movement"("company_id");
CREATE INDEX "movement_type_idx" ON "movement"("type");
CREATE INDEX "movement_blood_type_idx" ON "movement"("blood_type");

-- STEP 8: Create StockView
CREATE TABLE "stock_view" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_type" "blood_type_enum" NOT NULL,
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

-- STEP 9: Create StockAlert
CREATE TABLE "stock_alert" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "blood_type" "blood_type_enum" NOT NULL,
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

-- STEP 11: Drop V2 tables and backups (if they exist)
DROP TABLE IF EXISTS "_v2_batch_backup" CASCADE;
DROP TABLE IF EXISTS "_v2_movement_backup" CASCADE;
DROP TABLE IF EXISTS "_v2_stock_backup" CASCADE;
DROP TABLE IF EXISTS "stock" CASCADE;
DROP TABLE IF EXISTS "bloodstock_movement" CASCADE;
