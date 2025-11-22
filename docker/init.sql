-- ============================================================
-- 🩸 Blood Stock System - FULL INIT + SEED (VERSÃO FINAL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS bloodstock_movement, stock, batch_blood, batch, company, "user" CASCADE;

-- --------------------------
-- USERS
-- --------------------------
CREATE TABLE "user" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    person_type VARCHAR(15),
    uf VARCHAR(3),
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    address VARCHAR(200),
    city VARCHAR(50),
    zipcode VARCHAR(10)
);


-- --------------------------
-- COMPANIES
-- --------------------------
CREATE TABLE company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    institution_name VARCHAR(100) NOT NULL,
    cnes VARCHAR(15) NOT NULL,
    fk_user_id UUID NOT NULL UNIQUE,
    FOREIGN KEY (fk_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- --------------------------
-- BATCHES
-- --------------------------
CREATE TABLE batch (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
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
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
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
    action_by VARCHAR(100) NOT NULL,
    action_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Hash da senha 123456 (BCrypt)
INSERT INTO "user" (username, email, person_type, uf, password, name, address, city, zipcode)
VALUES
('hemorio', 'admin@hemorio.gov', 'admin', 'RJ', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'HemoRio Admin', 'Rua do Sangue, 100', 'Rio de Janeiro', '22220-000'),
('saopaulo', 'admin@sao-paulo.org', 'admin', 'SP', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hospital SP Admin', 'Av Paulista, 2000', 'São Paulo', '01310-100'),
('curitiba', 'admin@curitiba.br', 'admin', 'PR', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hemopar Admin', 'Rua Paraná, 300', 'Curitiba', '80000-000');


INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT
    ('12.345.678/0001-90'), 'HemoRio', '123456', id
FROM "user" WHERE username='hemorio';

INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT
    ('98.765.432/0001-12'), 'Hospital São Paulo', '654321', id
FROM "user" WHERE username='saopaulo';

INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT
    ('55.333.222/0001-77'), 'HemoCuritiba', '998877', id
FROM "user" WHERE username='curitiba';


-- ============================================================
-- GERAR 3 LOTES POR EMPRESA E PREENCHER COM TIPOS ALEATÓRIOS
-- ============================================================

DO $$
DECLARE
    company_record RECORD;
    batch_id UUID;
    blood_types TEXT[] := ARRAY['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'];
    i INT;
    lot INT;
BEGIN
    FOR company_record IN SELECT id FROM company LOOP
        FOR lot IN 1..3 LOOP
            INSERT INTO batch (batch_code, company_id)
            VALUES ('BATCH-' || substring(gen_random_uuid()::text, 1, 8), company_record.id)
            RETURNING id INTO batch_id;

            FOR i IN 1..array_length(blood_types, 1) LOOP
                INSERT INTO batch_blood (batch_id, blood_type, quantity)
                VALUES (batch_id, blood_types[i], (floor(random() * 20) + 5)::int);
            END LOOP;
        END LOOP;

        INSERT INTO stock (blood_type, quantity, company_id)
        SELECT blood_type, SUM(quantity), company_record.id
        FROM batch_blood bb
        JOIN batch b ON b.id = bb.batch_id
        WHERE b.company_id = company_record.id
        GROUP BY blood_type;
    END LOOP;
END $$;


-- 🚀 Indexes
CREATE INDEX idx_stock_company ON stock(company_id);
CREATE INDEX idx_batch_company ON batch(company_id);
CREATE INDEX idx_bloodstock_movement ON bloodstock_movement(bloodstock_id);
