# Blood Stock Service — Sangue Solidário

Microsserviço de gerenciamento de estoque de sangue da plataforma **Sangue Solidário**. Desenvolvido com **NestJS**, **TypeORM** e **PostgreSQL**.

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração e Instalação](#configuração-e-instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API Endpoints](#api-endpoints)
- [Modelo de Dados](#modelo-de-dados)
- [Docker](#docker)
- [Documentação da API](#documentação-da-api)

## Visão Geral

O **Blood Stock Service** é responsável por:

- Gerenciar o estoque de sangue por tipo sanguíneo de cada hemocentro
- Registrar entradas de lotes com controle de validade
- Processar saídas de estoque aplicando a regra **FEFO** (First Expired, First Out)
- Manter histórico completo de movimentações
- Gerar relatórios CSV do estoque
- Inicializar estoque automaticamente ao cadastro de novos hemocentros

### Tipos Sanguíneos Suportados

`A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-`

## Tecnologias

- **NestJS 11** — Framework Node.js
- **TypeORM 0.3** — ORM para PostgreSQL
- **PostgreSQL 16** — Banco de dados relacional
- **Passport JWT** — Autenticação via token JWT
- **Swagger + Scalar** — Documentação interativa da API
- **Docker** — Containerização

## Estrutura do Projeto

```
src/
├── database/
│   ├── migrations/              # Migrações do TypeORM
│   └── typeorm.config.ts        # Configuração do banco
├── modules/
│   ├── batch/
│   │   ├── entities/
│   │   │   ├── batch.entity.ts          # Entidade de lote
│   │   │   ├── batch-blood.entity.ts    # Detalhe por tipo sanguíneo do lote
│   │   │   └── blood-type.enum.ts       # Enum de tipos sanguíneos
│   │   └── batch.module.ts
│   ├── company/
│   │   ├── entities/
│   │   │   └── company.entity.ts        # Entidade de empresa/hemocentro
│   │   └── company.module.ts
│   ├── shared/
│   │   ├── auth/
│   │   │   ├── jwt.strategy.ts          # Estratégia JWT (Passport)
│   │   │   ├── jwt-auth.guard.ts        # Guard de autenticação
│   │   │   └── skip-auth.decorator.ts   # Decorator para pular auth
│   │   ├── errors/
│   │   │   ├── exceptions/              # Exceções customizadas
│   │   │   └── filters/                 # Filtro global de exceções
│   │   └── shared.module.ts
│   └── stock/
│       ├── dto/
│       │   ├── request/
│       │   │   ├── batch-entry-request.dto.ts   # DTO de entrada de lote
│       │   │   ├── batch-exit-request.dto.ts    # DTO de saída de estoque
│       │   │   └── init-stock-request.dto.ts    # DTO de inicialização
│       │   └── response/
│       │       ├── batch-response.dto.ts        # DTO de resposta de estoque
│       │       └── blood-detail.dto.ts          # DTO de detalhe sanguíneo
│       ├── entities/
│       │   ├── bloodstock.entity.ts             # Estoque por tipo sanguíneo
│       │   └── bloodstock-movement.entity.ts    # Histórico de movimentações
│       ├── exceptions/
│       │   └── insufficient-stock.exception.ts  # Exceção de estoque insuficiente
│       ├── stock.controller.ts
│       ├── stock.service.ts
│       └── stock.module.ts
├── app.module.ts
└── main.ts
```

## Configuração e Instalação

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16
- npm

### Instalação local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Rodar migrações
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev
```

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Modo desenvolvimento (watch) |
| `npm run build` | Compilar para produção |
| `npm run start:prod` | Iniciar em produção |
| `npm run migration:run` | Executar migrações |
| `npm run migration:revert` | Reverter última migração |
| `npm run migration:generate` | Gerar migração automática |
| `npm run test` | Executar testes |
| `npm run lint` | Executar linter |

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3004` |
| `DATABASE_URL` | Connection string PostgreSQL (produção) | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_HOST` | Host do banco (desenvolvimento) | `localhost` |
| `POSTGRES_PORT` | Porta do banco | `5432` |
| `POSTGRES_USERNAME` | Usuário do banco | `postgres` |
| `POSTGRES_PASSWORD` | Senha do banco | `postgres` |
| `POSTGRES_DATABASE` | Nome do banco | `bloodstock` |
| `JWT_SECRET` | Chave secreta para validação JWT | `secret` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | `http://localhost:3000` |

> O serviço aceita tanto `DATABASE_URL` (produção/Heroku) quanto variáveis individuais (desenvolvimento local).

## API Endpoints

Todos os endpoints (exceto `/init`) requerem autenticação via **Bearer Token** JWT. O `companyId` é extraído automaticamente do token.

### Estoque

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/stock` | Listar estoque da empresa |
| `POST` | `/api/stock/batchEntry` | Registrar entrada de lote |
| `POST` | `/api/stock/batchExit` | Registrar saída de estoque (FEFO) |
| `GET` | `/api/stock/batches/:bloodType` | Listar lotes disponíveis por tipo sanguíneo |
| `GET` | `/api/stock/history` | Histórico de movimentações |
| `GET` | `/api/stock/report` | Gerar relatório CSV |
| `POST` | `/api/stock/init` | Inicializar estoque (webhook interno, sem auth) |

### Exemplos de Request

**Entrada de lote:**
```json
POST /api/stock/batchEntry
{
  "batchCode": "LOTE-2026-001",
  "entryDate": "20/03/2026",
  "expiryDate": "20/09/2026",
  "bloodQuantities": {
    "A+": 10,
    "O-": 5,
    "AB+": 3
  }
}
```

**Saída de estoque:**
```json
POST /api/stock/batchExit
{
  "exitDate": "20/03/2026",
  "quantities": {
    "A+": 2,
    "O-": 1
  }
}
```

**Resposta de estoque:**
```json
[
  { "id": "uuid", "bloodType": "A+", "quantity": 8 },
  { "id": "uuid", "bloodType": "O-", "quantity": 4 },
  { "id": "uuid", "bloodType": "AB+", "quantity": 3 }
]
```

## Modelo de Dados

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   company    │       │      batch       │       │   batch_blood   │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)         │
│ name         │◄──┐   │ batchCode (UK)   │◄──┐   │ batch_id (FK)   │
│ cnpj         │   │   │ entry_date       │   └───│ blood_type      │
│ cnes         │   │   │ exit_date        │       │ quantity        │
│ institution  │   │   │ company_id (FK)──│───┘   │ expiry_date     │
│ fk_user_id   │   │   └──────────────────┘       └─────────────────┘
└──────────────┘   │
                   │   ┌──────────────────┐       ┌─────────────────────┐
                   │   │      stock       │       │   stock_movement    │
                   │   ├──────────────────┤       ├─────────────────────┤
                   │   │ id (PK)          │◄──┐   │ id (PK)             │
                   └───│ company_id (FK)  │   └───│ stock_id (FK)       │
                       │ blood_type       │       │ batch_id (FK)       │
                       │ quantity         │       │ movement            │
                       └──────────────────┘       │ quantity_before     │
                        UK(company, blood_type)   │ quantity_after      │
                                                  │ action_by           │
                                                  │ action_date         │
                                                  │ notes               │
                                                  └─────────────────────┘
```

## Docker

Este repositório é o **backend principal** do PI e contém o `docker-compose.yml` que orquestra **todos os microsserviços + frontend + bancos** do projeto Sangue Solidário.

### Estrutura esperada (clonar todos os repos como irmãos)

```
qualquer-pasta/
├── blood-stock-service/         ← este repo (contém o docker-compose.yml e scripts)
├── sangue-solidario-nextjs/     ← clonar lado a lado
├── users-service/               ← clonar lado a lado
├── donation-service/            ← clonar lado a lado
├── cdn-service-node/            ← clonar lado a lado
├── campaign-service/            ← clonar lado a lado
└── appointments-service-node/   ← clonar lado a lado
```

### Subindo o sistema completo

A partir desta pasta (`blood-stock-service/`):

```bash
# 1) Configurar variáveis de ambiente
cp .env.example .env
# editar .env com os secrets reais

# 2) Subir todos os serviços (backend + frontend + bancos)
docker compose up -d
# ou: ./up.sh

# 3) Verificar containers
docker compose ps

# 4) Logs
docker compose logs -f bloodstock-service

# 5) Derrubar tudo
docker compose down
# ou: ./down.sh
```

Scripts auxiliares: `up.sh`, `down.sh`, `rebuild.sh` (interativo), `restart.sh` (interativo).

### Subindo apenas o blood-stock isolado (modo desenvolvimento)

Se quiser desenvolver **somente** este serviço sem subir todos os outros, use o compose standalone:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

Esse arquivo sobe apenas `bloodstock-service` + `postgres_bloodstock` em uma rede isolada (`services-network`), com volume nomeado para persistir o banco.

### Dockerfile standalone (sem compose)

```bash
docker build -t bloodstock-service .
docker run -p 3004:3004 --env-file .env bloodstock-service
```

### Regra de rede entre containers

O `docker-compose.yml` cria 5 redes Docker bridge isoladas:

| Rede | Containers |
|---|---|
| `blood-users-network` | users-service + bloodstock-service + 2 Postgres |
| `donation-network` | donation-service + Mongo |
| `cdn-network` | cdn-service |
| `campaign-network` | campaign-service + Postgres |
| `appointments-network` | appointments-service-node + Postgres |

O frontend está em **todas** as redes (precisa falar com todos os backends). Dentro de cada rede, os containers se enxergam pelo nome (ex: `http://bloodstock-service:3004` a partir do users-service).

### Docker Hub (CI/CD)

A cada push na branch `main`, o workflow `.github/workflows/cd.yaml` automaticamente:

1. Faz login no Docker Hub usando os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` (sem expor credenciais no workflow)
2. Lê a TAG mais recente do versionamento Git (gerada pelo `ci.yaml` via semver)
3. Faz `docker build` com **duas tags**:
   - `:VERSION` — mesma tag do versionamento (ex: `v1.2.0`)
   - `:latest` — sempre aponta para a última imagem publicada
4. Faz `docker push` das duas tags para o repositório público
5. Após publicar no Docker Hub, faz pull da imagem versionada e re-tagueia para `registry.heroku.com` (deploy contínuo)

**Repositório público:** `https://hub.docker.com/r/<DOCKERHUB_USERNAME>/<HEROKU_APP_NAME>`

```bash
# Pull da última versão
docker pull <DOCKERHUB_USERNAME>/<HEROKU_APP_NAME>:latest

# Pull de uma versão específica
docker pull <DOCKERHUB_USERNAME>/<HEROKU_APP_NAME>:v1.2.0
```

> O Docker Hub é **acumulativo** — todas as TAGs versionadas geradas pelo pipeline ficam disponíveis para rollback ou inspeção, espelhando as tags do GitHub.

## Documentação da API

Com o serviço rodando, acesse:

| Rota | Descrição |
|------|-----------|
| `/docs` | **Scalar** — documentação interativa moderna |
| `/api-docs` | **Swagger UI** — documentação clássica |
