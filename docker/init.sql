-- Habilitar extensão para gerar UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1️⃣ Tabela de usuários
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

-- 2️⃣ Tabela de empresas (depende de "user")
CREATE TABLE company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    institution_name VARCHAR(100) NOT NULL,
    cnes VARCHAR(15) NOT NULL,
    fk_user_id UUID NOT NULL UNIQUE,
    FOREIGN KEY (fk_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- 3️⃣ Tabela de estoque de sangue (depende de company)
CREATE TABLE stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blood_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    update_date DATE DEFAULT NOW(),
    company_id UUID NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);

-- 4️⃣ Tabela de movimentação de estoque (depende de stock)
CREATE TABLE bloodstock_movement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloodstock_id UUID NOT NULL REFERENCES stock(id),
    movement INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    action_by VARCHAR(100) NOT NULL,
    action_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);
