# 🩸 Blood Stock Service

![NestJS](https://img.shields.io/badge/NestJS-11.0.3-E0234E?logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

Sistema completo de gerenciamento de estoque de sangue desenvolvido com **NestJS** seguindo os princípios de **Clean Architecture** (Arquitetura Hexagonal).

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [⚡ NOVO: Schema Refatorado](#-novo-schema-refatorado)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Início Rápido](#-início-rápido)
- [Documentação da API](#-documentação-da-api)
- [Testes](#-testes)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **Blood Stock Service** é uma API RESTful para gerenciamento de estoque de sangue em hospitais e bancos de sangue. O sistema permite:

- ✅ Gerenciamento de estoque de 8 tipos sanguíneos (A+, A-, B+, B-, AB+, AB-, O+, O-)
- ✅ Registro de movimentações (entrada/saída de bolsas)
- ✅ Histórico completo de auditoria
- ✅ Validação de estoque suficiente antes de saídas
- ✅ Suporte multi-empresa (múltiplos hospitais/bancos de sangue)
- ✅ Documentação interativa com Swagger/OpenAPI 3.0

---

## ⚡ NOVO: Schema Refatorado

> **🎉 Nova arquitetura de dados disponível!**  
> Schema completo para rastreamento individual de bolsas de sangue com compliance ANVISA.

### 🔥 Destaques

- **Rastreabilidade Individual**: Cada bolsa tem código único rastreável
- **FIFO Automático**: Sistema garante uso da bolsa mais antiga primeiro
- **Alertas Proativos**: Notificações de estoque baixo e vencimento próximo
- **Auditoria Completa**: Registro completo de origem, destino, usuário e timestamp
- **Performance 50x**: StockView materializada para consultas instantâneas

### 📚 Documentação Completa

| Documento | Descrição | Tamanho |
|-----------|-----------|---------|
| **[📊 Resumo Executivo](docs/REFACTORING_SUMMARY.md)** | Visão geral visual com comparações e métricas | ~15KB |
| **[📖 Análise Completa](docs/COMPLETE_SCHEMA_ANALYSIS.md)** | Análise detalhada com 8 problemas identificados + solução | ~100KB |
| **[🔧 Schema Refatorado](prisma/schema-refactored.prisma)** | Schema Prisma production-ready (8 modelos, 5 enums) | 500 linhas |
| **[🚀 Guia de Migração](docs/MIGRATION_GUIDE.md)** | 2 estratégias de migração (Reset vs Transform) | ~15KB |
| **[💻 Exemplos de Queries](src/examples/queries-refactored.ts)** | 20+ funções prontas para uso | 700 linhas |
| **[🧪 Como Testar](HOW_TO_TEST_NEW_SCHEMA.md)** | Guia passo a passo para testar novo schema | ~10KB |

### 🎯 Comparação Rápida

| Aspecto | Schema Atual | Schema Novo |
|---------|--------------|-------------|
| Rastreabilidade | ❌ Agregado | ✅ Individual |
| FIFO | ❌ Manual | ✅ Automático |
| Validade | ❌ Sem controle | ✅ Por bolsa + alertas |
| Performance | ~500ms | ✅ ~10ms (50x mais rápido) |
| Compliance ANVISA | ❌ | ✅ Conforme |

### 🚀 Como Começar

```bash
# 1. Aplicar novo schema
cp prisma/schema-refactored.prisma prisma/schema.prisma
npx prisma migrate dev --name refactor_blood_stock

# 2. Popular com dados de teste
npx ts-node prisma/seed-refactored.ts

# 3. Testar queries
npx ts-node test-queries.ts
```

> 📖 **Documentação completa**: [HOW_TO_TEST_NEW_SCHEMA.md](HOW_TO_TEST_NEW_SCHEMA.md)

---

## 🚀 Tecnologias

### Backend

- **[NestJS](https://nestjs.com/)** 11.0.3 - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** 5.8.2 - Superset tipado de JavaScript
- **[Prisma ORM](https://www.prisma.io/)** 6.4.1 - ORM type-safe para PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** 15 - Banco de dados relacional
- **[class-validator](https://github.com/typestack/class-validator)** 0.14.2 - Validação de DTOs

### DevOps & Documentação

- **[Docker](https://www.docker.com/)** - Containerização multi-stage
- **[Docker Compose](https://docs.docker.com/compose/)** - Orquestração de containers
- **[Swagger/OpenAPI](https://swagger.io/)** 3.0 - Documentação interativa da API
- **[Jest](https://jestjs.io/)** - Framework de testes

---

## 🏗️ Arquitetura

Este projeto segue os princípios de **Clean Architecture** (Arquitetura Hexagonal), garantindo:

- 🔹 **Separação de responsabilidades** em camadas bem definidas
- 🔹 **Independência de frameworks** (domínio não conhece NestJS)
- 🔹 **Testabilidade** (domínio testado isoladamente)
- 🔹 **Manutenibilidade** (mudanças localizadas)

### Camadas

```
src/
├── domain/                    # 🎯 Camada de Domínio (Business Logic)
│   ├── entities/              # Entidades de negócio
│   ├── value-objects/         # Objetos de valor imutáveis
│   ├── services/              # Serviços de domínio
│   └── errors/                # Exceções de negócio
│
├── application/               # 📋 Camada de Aplicação (Use Cases)
│   └── use-cases/             # Casos de uso do sistema
│
└── adapters/                  # 🔌 Camada de Adaptadores
    ├── in/                    # Adaptadores de entrada
    │   └── web/               # Controllers REST
    └── out/                   # Adaptadores de saída
        └── persistence/       # Repositórios Prisma
```

### Princípios Aplicados

- ✅ **Dependency Inversion** - Domínio não depende de infraestrutura
- ✅ **Single Responsibility** - Cada classe tem uma única responsabilidade
- ✅ **Interface Segregation** - Interfaces específicas para cada caso de uso
- ✅ **Liskov Substitution** - Implementações substituíveis via interfaces

---

## ⚡ Início Rápido

### Pré-requisitos

- **Docker** 20.10+ e **Docker Compose** 2.0+
- **Node.js** 20+ e **npm** 10+ (apenas para desenvolvimento local)

### 1. Clone o Repositório

```bash
git clone https://github.com/bloodstock/blood-stock-service.git
cd blood-stock-service
```

### 2. Execute com Docker (Recomendado)

```bash
# Construir e iniciar containers
docker-compose up --build

# Em modo detached (background)
docker-compose up -d
```

A aplicação estará disponível em:

- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5432

### 3. Desenvolvimento Local (Opcional)

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Gerar Prisma Client
npx prisma generate

# Criar banco de dados
npx prisma migrate deploy

# Popular com dados de teste
npx prisma db seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

---

## 📚 Documentação da API

### Swagger UI

A documentação interativa está disponível em **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

**Recursos disponíveis**:
- 📖 Explorar todos os endpoints
- 🧪 Testar requisições (botão "Try it out")
- 📝 Ver exemplos de request/response
- ⚠️ Visualizar códigos de erro
- 📊 Explorar schemas de dados

### Documentação Completa

Para guia detalhado com exemplos e casos de uso, consulte: **[docs/API.md](docs/API.md)**

### Endpoints Principais

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| `GET` | `/health` | Health check da aplicação | ✅ |
| `GET` | `/stocks` | Lista estoques com filtros | 🚧 |
| `GET` | `/stocks/:id` | Busca estoque por ID | 🚧 |
| `GET` | `/stocks/:id/movements` | Histórico de movimentações | 🚧 |
| `PATCH` | `/stocks/:id/adjust` | Ajusta quantidade (entrada/saída) | ✅ |

### Exemplo de Uso

```bash
# Ajustar estoque (entrada de 10 bolsas)
curl -X PATCH http://localhost:3000/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 10,
    "actionBy": "admin@hospital.com",
    "notes": "Doação da campanha de janeiro"
  }'
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
npm test
```

### Testes Unitários (Domínio)

```bash
npm run test:unit
```

### Testes de Integração

```bash
npm run test:integration
```

### Cobertura de Código

```bash
npm run test:cov
```

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run start` | Inicia aplicação em modo produção |
| `npm run start:dev` | Inicia com hot-reload (desenvolvimento) |
| `npm run start:debug` | Inicia em modo debug |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm test` | Executa todos os testes |
| `npm run test:cov` | Executa testes com cobertura |
| `npm run lint` | Verifica padrões de código (ESLint) |
| `npm run format` | Formata código (Prettier) |
| `npx prisma studio` | Abre GUI do Prisma para visualizar dados |
| `npx prisma migrate dev` | Cria nova migration |
| `npx prisma db seed` | Popula banco com dados de teste |

---

## 📁 Estrutura do Projeto

```
blood-stock-service/
├── src/
│   ├── domain/                        # 🎯 Camada de Domínio
│   │   ├── entities/
│   │   │   ├── Stock.ts               # Entidade de estoque
│   │   │   ├── StockMovement.ts       # Entidade de movimentação
│   │   │   └── Batch.ts               # Entidade de lote
│   │   ├── value-objects/
│   │   │   ├── BloodType.ts           # Tipo sanguíneo (VO)
│   │   │   └── StockQuantity.ts       # Quantidade de estoque (VO)
│   │   ├── services/
│   │   │   └── StockAdjustmentService.ts
│   │   └── errors/
│   │       └── InsufficientStockError.ts
│   │
│   ├── application/                   # 📋 Camada de Aplicação
│   │   └── use-cases/
│   │       └── adjust-stock/
│   │           ├── AdjustStockUseCase.ts
│   │           └── AdjustStockCommand.ts
│   │
│   ├── adapters/                      # 🔌 Camada de Adaptadores
│   │   ├── in/
│   │   │   └── web/
│   │   │       ├── stock/
│   │   │       │   ├── stock.controller.ts
│   │   │       │   └── dto/
│   │   │       ├── health/
│   │   │       │   ├── health.controller.ts
│   │   │       │   └── dto/
│   │   │       └── common/
│   │   │           └── error-response.dto.ts
│   │   └── out/
│   │       └── persistence/
│   │           └── stock/
│   │               ├── stock-prisma.adapter.ts
│   │               └── stock-prisma.mapper.ts
│   │
│   ├── app.module.ts                  # Módulo raiz do NestJS
│   └── main.ts                        # Bootstrap da aplicação
│
├── prisma/
│   ├── schema.prisma                  # Schema do banco de dados
│   ├── seed.js                        # Dados iniciais
│   └── migrations/                    # Migrations SQL
│
├── docker/
│   └── init.sql                       # Script de inicialização do DB
│
├── docs/
│   └── API.md                         # Documentação completa da API
│
├── Dockerfile                         # Multi-stage Docker build
├── docker-compose.yml                 # Orquestração de containers
├── .dockerignore                      # Arquivos ignorados no build
└── README.md                          # Este arquivo
```

---

## 🔒 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=bloodstock
DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}

# Application
PORT=3000
NODE_ENV=development
```

---

## 🐳 Docker

### Multi-Stage Build

O projeto utiliza builds multi-stage para otimizar o tamanho da imagem:

- **Builder**: Compila TypeScript e gera Prisma Client (~1.4GB)
- **Production**: Apenas dist + node_modules necessários (~600MB)

### Comandos Úteis

```bash
# Reconstruir containers
docker-compose up --build

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Executar comando no container
docker-compose exec app sh

# Executar migrations manualmente
docker-compose exec app npx prisma migrate deploy
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está licenciado sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Contato

- **Email**: support@bloodstock.com
- **GitHub**: https://github.com/bloodstock/blood-stock-service
- **Issues**: https://github.com/bloodstock/blood-stock-service/issues

---

**Desenvolvido com ❤️ usando NestJS + Clean Architecture**
