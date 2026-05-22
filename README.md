# Blood Stock Service — Sangue Solidário

Microsserviço de gerenciamento de estoque de sangue da plataforma **Sangue Solidário**. Desenvolvido com **NestJS**, **TypeORM** e **PostgreSQL**.

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Repositórios](#repositórios)
- [Ambientes](#ambientes)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração e Instalação](#configuração-e-instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API Endpoints](#api-endpoints)
- [Modelo de Dados](#modelo-de-dados)
- [Docker](#docker)
- [Documentação da API](#documentação-da-api)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Observabilidade e Logs](#observabilidade-e-logs)
- [Banco de Dados](#banco-de-dados)
- [Análise de Qualidade — SonarCloud](#análise-de-qualidade--sonarcloud)

---

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

---

## Tecnologias

### Backend
- **NestJS 11** — Framework Node.js
- **TypeORM 0.3** — ORM para PostgreSQL
- **PostgreSQL 16** — Banco de dados relacional (Neon — nuvem)
- **Passport JWT** — Autenticação via token JWT
- **Swagger + Scalar** — Documentação interativa da API
- **Pino + BetterStack** — Logs estruturados e observabilidade
- **Docker** — Containerização
- **Heroku** — Deploy de produção
- **Azure Container Apps** — Deploy de homologação

### Frontend
- **Next.js + React** — Framework frontend
- **Vercel** — Deploy de produção
- **Azure Container Apps** — Deploy de homologação

---

## Repositórios

| Serviço | Repositório |
|---|---|
| Backend (este repo) | https://github.com/c3ny/blood-stock-service |
| Frontend | https://github.com/c3ny/sangue-solidario-nextjs |

---

## Ambientes

| Ambiente | Frontend | Backend | Banco (Neon) |
|---|---|---|---|
| **Produção** | https://sanguesolidario.vercel.app | https://blood-stock-service-48ee65468831.herokuapp.com | `blood-stock-service` |
| **Homologação** | https://bloodstock-front-hml.ambitiousglacier-259f847e.brazilsouth.azurecontainerapps.io | https://blodstock.ambitiousglacier-259f847e.brazilsouth.azurecontainerapps.io | `bloodstock-hml` |

---

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
├── shared/
│   ├── filters/
│   │   └── all-exceptions.filter.ts     # Filtro global de exceções não tratadas
│   ├── interceptors/
│   │   └── http-logging.interceptor.ts  # Log estruturado de requests/responses
│   └── logger/
│       └── app-logger.service.ts        # Serviço de logging (Pino + BetterStack)
├── app.module.ts
└── main.ts
```

---

## Configuração e Instalação

### Pré-requisitos

- Node.js 22+
- PostgreSQL 16 (ou acesso ao Neon)
- npm

### Instalação local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# edite o .env com suas credenciais

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
| `npm run test:coverage` | Testes com relatório de cobertura (mínimo 80%) |
| `npm run lint` | Executar linter |

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3004` |
| `DATABASE_URL` | Connection string PostgreSQL (produção/Neon) | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_HOST` | Host do banco (desenvolvimento) | `localhost` |
| `POSTGRES_PORT` | Porta do banco | `5432` |
| `POSTGRES_USERNAME` | Usuário do banco | `postgres` |
| `POSTGRES_PASSWORD` | Senha do banco | `postgres` |
| `POSTGRES_DATABASE` | Nome do banco | `bloodstock` |
| `JWT_SECRET` | Chave secreta para validação JWT | gerado com `openssl rand -base64 48` |
| `INTERNAL_SECRET` | Chave para webhooks internos | gerado com `openssl rand -base64 48` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | `http://localhost:3000` |
| `BETTERSTACK_SOURCE_TOKEN` | Token do source no BetterStack | obtido no painel BetterStack |

> O serviço aceita tanto `DATABASE_URL` (produção/Neon) quanto variáveis individuais (desenvolvimento local).

---

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
| `POST` | `/api/stock/init` | Inicializar estoque (webhook interno, sem auth JWT) |

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

---

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

---

## Docker

Este repositório contém o `docker-compose.yml` que orquestra **todos os microsserviços + frontend + bancos** do projeto Sangue Solidário.

### Estrutura esperada (clonar todos os repos como irmãos)

```
qualquer-pasta/
├── blood-stock-service/         ← este repo (contém o docker-compose.yml)
├── sangue-solidario-nextjs/
├── users-service/
├── donation-service/
├── cdn-service-node/
├── campaign-service/
└── appointments-service-node/
```

### Subindo o sistema completo

```bash
cp .env.example .env
# editar .env com os secrets reais

docker compose up -d
docker compose ps
docker compose logs -f bloodstock-service

docker compose down
```

Scripts auxiliares: `up.sh`, `down.sh`, `rebuild.sh` (interativo), `restart.sh` (interativo).

### Modo standalone (só o blood-stock)

```bash
docker compose -f docker-compose.standalone.yml up -d
```

### Docker Hub

Imagens publicadas na organização **`firec4io`** a cada push em `main`.

| Repositório | Link |
|---|---|
| Organização Docker Hub | https://hub.docker.com/orgs/firec4io/repositories |
| blood-stock-service | https://hub.docker.com/r/firec4io/blood-stock-service |

```bash
docker pull firec4io/blood-stock-service:latest
docker pull firec4io/blood-stock-service:v0.7.14   # exemplo de tag versionada
```

O workflow CD builda com a tag semântica do git (ex: `v0.7.14`) + `latest` e faz push automático. O repositório é criado pelo próprio workflow se não existir.

| Secret GitHub | Uso |
|---|---|
| `DOCKERHUB_USERNAME` | Usuário que faz login |
| `DOCKERHUB_TOKEN` | Personal Access Token |
| `DOCKERHUB_NAMESPACE` | Organização de destino (`firec4io`) |

---

## Documentação da API

Com o serviço rodando localmente, acesse:

| Rota | Descrição |
|------|-----------|
| `/docs` | **Scalar** — documentação interativa moderna |
| `/api-docs` | **Swagger UI** — documentação clássica |

Em produção:

| Ambiente | Swagger | Scalar |
|---|---|---|
| Produção | https://blood-stock-service-48ee65468831.herokuapp.com/api-docs | https://blood-stock-service-48ee65468831.herokuapp.com/docs |
| Homologação | https://blodstock.ambitiousglacier-259f847e.brazilsouth.azurecontainerapps.io/api-docs | https://blodstock.ambitiousglacier-259f847e.brazilsouth.azurecontainerapps.io/docs |

A versão exibida no Swagger reflete automaticamente a versão do `package.json` (gerada pelo CI a cada push).

---

## Testes

```bash
# Rodar todos os testes
npm run test

# Com cobertura (threshold: 80% em funções, linhas e statements)
npm run test:coverage
```

Os testes ficam em `test/` e seguem o padrão `*.spec.ts`. A cobertura é coletada sobre `src/modules/stock/stock.controller.ts` e o relatório LCOV é gerado em `coverage/lcov.info` para consumo pelo SonarCloud.

---

## CI/CD

### CI — `.github/workflows/ci.yaml`

Dispara em **push e pull request** para `main` e `develop`.

| Step | Descrição |
|---|---|
| Build | `npm run build` |
| Testes + cobertura | `npm run test:coverage` — falha se abaixo de 80% |
| Build Docker | Imagem com tag `ci-<sha>` |
| SonarCloud | Análise estática com relatório LCOV |
| Versionamento semântico | Lê conventional commits e bumpa `package.json` + cria tag git |
| E-mail em falha | Notificação via Gmail para o responsável |

### CD — `.github/workflows/cd.yaml`

Dispara em **push para `main`**.

| Step | Descrição |
|---|---|
| Build + push Docker Hub | Tags `:latest` e `:vX.Y.Z` para `firec4io/blood-stock-service` |
| SonarCloud | Análise com cobertura LCOV |
| Deploy Heroku | Push para `registry.heroku.com` + `heroku container:release` |

### Secrets necessários no GitHub

| Secret | Uso |
|---|---|
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` / `DOCKERHUB_NAMESPACE` | Docker Hub |
| `HEROKU_API_KEY` / `HEROKU_APP_NAME` | Deploy Heroku |
| `SONAR_TOKEN` / `SONAR_PROJECT_KEY` / `SONAR_ORGANIZATION` | SonarCloud |
| `GH_TOKEN` | Push de tags e commits de versão |
| `EMAIL_ORIGIN` / `SENHA_EMAIL` / `EMAIL_DESTINO` | Notificação de falha |

---

## Observabilidade e Logs

O serviço utiliza **Pino** para logging estruturado com envio para **BetterStack** (source: *Sangue Solidario Bloodstock*).

### Comportamento por ambiente

| Ambiente | Saída |
|---|---|
| `development` | Terminal colorido via `pino-pretty` |
| `production` + `BETTERSTACK_SOURCE_TOKEN` | Logs enviados para BetterStack via `@logtail/pino` |
| `production` sem token | JSON no stdout (fallback) |

### Campos redactados automaticamente

`body.password`, `body.token`, `body.newPassword`, `headers.authorization`, `headers.cookie` — substituídos por `[REDACTED]` antes do envio.

### O que é logado

- Cada request recebido (método, path, params, query, body, IP, user-agent)
- Cada response (status, duração em ms)
- Erros não tratados (com stack trace)
- Operações de negócio: entrada de lote, saída FEFO, inicialização de estoque

Configure `BETTERSTACK_SOURCE_TOKEN` no `.env` para habilitar o envio ao BetterStack.

---

## Banco de Dados

Banco de dados **PostgreSQL** hospedado no **[Neon](https://neon.tech)** (serverless Postgres).

| Ambiente | Projeto Neon | Conexão |
|---|---|---|
| Produção | `blood-stock-service` | via `DATABASE_URL` no Heroku |
| Homologação | `bloodstock-hml` | via `DATABASE_URL` no Azure |

Em desenvolvimento local, use PostgreSQL local ou Docker (via `docker-compose.standalone.yml`).

---

## Análise de Qualidade — SonarCloud

Análise estática de segurança e qualidade roda no GitHub Actions a cada push em `main` e `develop` e em todo pull request.

- **Projeto público:** https://sonarcloud.io/project/overview?id=c3ny_blood-stock-service
- **Organização:** https://sonarcloud.io/organizations/c3ny

| Secret GitHub | Uso |
|---|---|
| `SONAR_TOKEN` | Token de autenticação |
| `SONAR_PROJECT_KEY` | `c3ny_blood-stock-service` |
| `SONAR_ORGANIZATION` | `c3ny` |
