CREATE INDEX IF NOT EXISTS "stock_company_id_blood_type_idx"
  ON "stock" ("company_id", "blood_type");

CREATE INDEX IF NOT EXISTS "stock_created_at_idx"
  ON "stock" ("created_at");

CREATE INDEX IF NOT EXISTS "bloodstock_movement_stock_id_created_at_idx"
  ON "bloodstock_movement" ("stock_id", "created_at");

CREATE INDEX IF NOT EXISTS "bloodstock_movement_created_at_idx"
  ON "bloodstock_movement" ("created_at");
