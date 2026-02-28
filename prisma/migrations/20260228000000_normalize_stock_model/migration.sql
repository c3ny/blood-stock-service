-- Migration: Normalize Stock model to eliminate redundancy
-- Before: 1 Stock with quantityA/B/AB/O (ambiguous)
-- After: 8 Stocks per company (1 per bloodType, clear)

-- Step 1: Add new quantity column (temporary)
ALTER TABLE "stock" ADD COLUMN "quantity" INTEGER;

-- Step 2: Data migration logic
-- IMPORTANT: This requires custom logic based on your current data.
-- If you currently have 1 stock per company storing all 4 types:
--   You need to split into 8 records (one per blood type)
-- 
-- Example transformation (ADAPT TO YOUR ACTUAL DATA):
-- 
-- DO $$
-- DECLARE
--   company RECORD;
-- BEGIN
--   FOR company IN SELECT DISTINCT company_id FROM stock LOOP
--     -- Get the single stock record for this company
--     -- Split it into 8 records (one per blood type)
--     -- This is a COMPLEX migration - needs manual review!
--   END LOOP;
-- END $$;

-- Step 3: Drop old quantity columns (after data migration)
-- UNCOMMENT AFTER VERIFYING DATA MIGRATION:
-- ALTER TABLE "stock" DROP COLUMN "quantity_a";
-- ALTER TABLE "stock" DROP COLUMN "quantity_b";
-- ALTER TABLE "stock" DROP COLUMN "quantity_ab";
-- ALTER TABLE "stock" DROP COLUMN "quantity_o";

-- Step 4: Add unique constraint for companyId + bloodType
-- UNCOMMENT AFTER DATA CLEANUP:
-- ALTER TABLE "stock" ADD CONSTRAINT "stock_company_id_blood_type_key" 
--   UNIQUE ("company_id", "blood_type");

-- Step 5: Drop old index and create new ones
-- DROP INDEX IF EXISTS "stock_company_id_blood_type_idx";
-- CREATE INDEX "stock_company_id_idx" ON "stock"("company_id");
-- CREATE INDEX "stock_blood_type_idx" ON "stock"("blood_type");

-- MIGRATION NOTES:
-- 1. This migration is PARTIALLY automated due to data transformation complexity
-- 2. You MUST manually migrate existing data from 4 columns to 8 records
-- 3. Test on STAGING database first!
-- 4. Uncomment steps 3-5 only after validating data migration

-- Example of what needs to happen (pseudo-code):
-- 
-- OLD: 1 record
-- {
--   company_id: "empresa-1",
--   blood_type: "A_POS", -- irrelevant in old model
--   quantity_a: 10,
--   quantity_b: 5,
--   quantity_ab: 3,
--   quantity_o: 8
-- }
--
-- NEW: 8 records (need to determine which quantity maps to which type!)
-- {company_id: "empresa-1", blood_type: "A_POS", quantity: ???}  -- From quantity_a? But which A?
-- {company_id: "empresa-1", blood_type: "A_NEG", quantity: ???}  -- From quantity_a? But which A?
-- {company_id: "empresa-1", blood_type: "B_POS", quantity: ???}
-- {company_id: "empresa-1", blood_type: "B_NEG", quantity: ???}
-- {company_id: "empresa-1", blood_type: "AB_POS", quantity: ???}
-- {company_id: "empresa-1", blood_type: "AB_NEG", quantity: ???}
-- {company_id: "empresa-1", blood_type: "O_POS", quantity: ???}
-- {company_id: "empresa-1", blood_type: "O_NEG", quantity: ???}

-- ⚠️ CRITICAL DECISION NEEDED:
-- How to split quantity_a into A_POS and A_NEG?
-- Option 1: Sum all into one type (loses granularity)
-- Option 2: Split evenly (arbitrary)
-- Option 3: Query historical data to infer distribution
-- Option 4: Start fresh with 0 for all (safest for new system)
