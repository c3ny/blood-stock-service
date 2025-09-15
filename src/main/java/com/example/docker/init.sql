-- Habilitar extensão para gerar UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Cria o banco de dados
CREATE DATABASE "SangueSolidario";

-- Conecta ao banco
\c SangueSolidario;

-- Tabela stock (exemplo anterior)
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL
);

-- Tabela user
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

-- Tabela company
CREATE TABLE company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    institution_name VARCHAR(100) NOT NULL,
    cnes VARCHAR(15) NOT NULL,
    fk_user_id UUID NOT NULL UNIQUE,
    FOREIGN KEY (fk_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
