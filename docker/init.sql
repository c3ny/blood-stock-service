-- ============================================================
-- 📌 Blood Stock System - Full Init + Seed
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
DROP TABLE IF EXISTS bloodstock_movement, stock, batch_blood, batch, company, "user" CASCADE;

CREATE TABLE "user" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    person_type VARCHAR(15),
    uf VARCHAR(3) NOT NULL,
    password VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    city VARCHAR(50),
    zipcode VARCHAR(10)
);


-- ============================================================
-- COMPANY
-- ============================================================
CREATE TABLE company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    institution_name VARCHAR(100) NOT NULL,
    cnes VARCHAR(15) NOT NULL,
    fk_user_id UUID NOT NULL UNIQUE,
    FOREIGN KEY (fk_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);


-- ============================================================
-- BATCHES
-- ============================================================
CREATE TABLE batch (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_code VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);


-- ============================================================
-- BATCH BLOOD DETAILS
-- ============================================================
CREATE TABLE batch_blood (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL,
    blood_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE
);


-- ============================================================
-- STOCK (CONSOLIDATED)
-- ============================================================
CREATE TABLE stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blood_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    update_date TIMESTAMP DEFAULT NOW(),
    company_id UUID NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    UNIQUE (blood_type, company_id)
);


-- ============================================================
-- MOVEMENT LOG
-- ============================================================
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

-- USERS
INSERT INTO "user" (email, person_type, uf, password, name, address, city, zipcode)
VALUES
('admin@hemorio.gov', 'admin', 'RJ', '123456', 'HemoRio Admin', 'Rua do Sangue, 100', 'Rio de Janeiro', '22220-000'),
('admin@sao-paulo.org', 'admin', 'SP', '123456', 'Hospital SP', 'Av Paulista, 2000', 'São Paulo', '01310-100'),
('admin@curitiba.br', 'admin', 'PR', '123456', 'HemoCuritiba', 'Rua Paraná, 300', 'Curitiba', '80000-000');



-- COMPANIES (automatically linked)
INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT '12.345.678/0001-90', 'HemoRio', '123456', id FROM "user" WHERE email='admin@hemorio.gov';

INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT '98.765.432/0001-12', 'Hospital São Paulo', '654321', id FROM "user" WHERE email='admin@sao-paulo.org';

INSERT INTO company (cnpj, institution_name, cnes, fk_user_id)
SELECT '55.333.222/0001-77', 'HemoCuritiba', '998877', id FROM "user" WHERE email='admin@curitiba.br';



-- ============================================================
-- SEED FUNCTION TO CREATE BATCHES + STOCK AUTOMATICALLY
-- ============================================================

DO $$
DECLARE
    company_record RECORD;
    batch1 UUID;
    batch2 UUID;
    blood_types TEXT[] := ARRAY['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'];
    idx INT;
BEGIN
    FOR company_record IN SELECT id FROM company LOOP

        -- Criar os dois lotes
        INSERT INTO batch (batch_code, company_id)
        VALUES (floor(random()*900)+100, company_record.id)
        RETURNING id INTO batch1;

        INSERT INTO batch (batch_code, company_id)
        VALUES (floor(random()*900)+100, company_record.id)
        RETURNING id INTO batch2;

        -- Popular cada lote com tipos sanguíneos diferentes
        FOR idx IN 1..array_length(blood_types, 1) LOOP

            -- 1° lote recebe metade dos tipos
            IF idx <= 4 THEN
                INSERT INTO batch_blood (batch_id, blood_type, quantity)
                VALUES (batch1, blood_types[idx], (floor(random()*20)+5));
            ELSE
                INSERT INTO batch_blood (batch_id, blood_type, quantity)
                VALUES (batch2, blood_types[idx], (floor(random()*20)+5));
            END IF;

        END LOOP;

        -- Consolidar estoques para a empresa
        INSERT INTO stock (blood_type, quantity, company_id)
        SELECT blood_type, SUM(quantity), company_record.id
        FROM batch_blood bb
        JOIN batch b ON b.id = bb.batch_id
        WHERE b.company_id = company_record.id
        GROUP BY blood_type;

    END LOOP;
END $$;


-- ============================================================
-- END
-- ============================================================

