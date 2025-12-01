CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpeza (somente tabelas pertinentes ao serviço)
DROP TABLE IF EXISTS bloodstock_movement, stock, batch_blood, batch CASCADE;

-- --------------------------
-- BATCHES
-- --------------------------
CREATE TABLE batch (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL, -- referência ao User Service
    -- NÃO CRIA FK pois o User Service está em outro banco/serviço
    -- se quiser soft reference:
    -- FOREIGN KEY (company_id) REFERENCES company(id)
    CONSTRAINT batch_company_not_null CHECK (company_id IS NOT NULL)
);

-- --------------------------
-- BLOOD PER BATCH
-- --------------------------
CREATE TABLE batch_blood (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL,
    blood_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE
);

-- --------------------------
-- CONSOLIDATED STOCK
-- --------------------------
CREATE TABLE stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blood_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    update_date TIMESTAMP DEFAULT NOW(),
    company_id UUID NOT NULL,
    UNIQUE (blood_type, company_id)
);

-- --------------------------
-- STOCK MOVEMENTS
-- --------------------------
CREATE TABLE bloodstock_movement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bloodstock_id UUID NOT NULL REFERENCES stock(id),
    movement INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    action_by UUID NOT NULL, -- agora é o ID do usuário vindo do User Service
    action_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);