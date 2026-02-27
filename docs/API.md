# 🩸 Blood Stock Service - Documentação da API

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Acesso à Documentação](#acesso-à-documentação)
- [Autenticação](#autenticação)
- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Tipos Sanguíneos](#tipos-sanguíneos)
- [Exemplos de Uso](#exemplos-de-uso)
- [Tratamento de Erros](#tratamento-de-erros)
- [Casos de Uso Comuns](#casos-de-uso-comuns)

---

## 🎯 Visão Geral

A **Blood Stock Service API** é uma REST API desenvolvida com NestJS seguindo os princípios de Clean Architecture (Arquitetura Hexagonal). O sistema gerencia:

- ✅ Estoque de sangue por empresa (hospitais e bancos de sangue)
- ✅ Movimentações de entrada e saída de bolsas
- ✅ Histórico completo de auditoria
- ✅ Validação de estoque suficiente
- ✅ 8 tipos sanguíneos suportados

### Tecnologias

- **Framework**: NestJS 11.x + TypeScript
- **Banco de Dados**: PostgreSQL 15 com Prisma ORM
- **Documentação**: OpenAPI 3.0 (Swagger)
- **Validação**: class-validator + class-transformer
- **Containerização**: Docker + Docker Compose

---

## 🌐 Acesso à Documentação

### Swagger UI (Interface Interativa)

**URL Local**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

A interface Swagger permite:
- 📖 Visualizar todos os endpoints disponíveis
- 🧪 Testar requisições diretamente no navegador (botão **"Try it out"**)
- 📝 Ver exemplos de request/response
- ⚠️ Visualizar códigos de erro possíveis
- 📊 Explorar schemas de dados

### Exportar Especificação OpenAPI

Para obter o arquivo JSON da especificação:

```bash
# Acessar endpoint de exportação
curl http://localhost:3000/api-docs-json > openapi.json
```

---

## 🔐 Autenticação

> **⚠️ Atualmente**: A API não requer autenticação.
>
> **🚀 Futuro**: Será implementado JWT Bearer Authentication.

Quando a autenticação for implementada:

```bash
# Header necessário
Authorization: Bearer <JWT_TOKEN>
```

---

## 📡 Endpoints Disponíveis

### **Estoque de Sangue** 🩸

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| `GET` | `/stocks` | Lista estoques com filtros | 🚧 Em desenvolvimento |
| `GET` | `/stocks/:stockId` | Busca estoque por ID | 🚧 Em desenvolvimento |
| `GET` | `/stocks/:stockId/movements` | Histórico de movimentações | 🚧 Em desenvolvimento |
| `PATCH` | `/stocks/:stockId/adjust` | Ajusta quantidade (entrada/saída) | ✅ Implementado |

### **Sistema** 🔧

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| `GET` | `/health` | Health check da aplicação | 🚧 Planejado |

---

## 🩸 Tipos Sanguíneos

A API suporta os seguintes tipos sanguíneos:

```typescript
enum BloodType {
  'A+',  // A positivo
  'A-',  // A negativo
  'B+',  // B positivo
  'B-',  // B negativo
  'AB+', // AB positivo
  'AB-', // AB negativo
  'O+',  // O positivo (doador universal)
  'O-'   // O negativo (receptor universal)
}
```

---

## 🧪 Exemplos de Uso

### 1. Ajustar Estoque (Entrada de Bolsas)

**Endpoint**: `PATCH /stocks/:stockId/adjust`

**Cenário**: Recebimento de 10 bolsas de sangue O+ no Hospital A

```bash
curl -X PATCH http://localhost:3000/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 10,
    "actionBy": "nurse@hospital-a.com",
    "notes": "Doação da campanha de janeiro"
  }'
```

**Response** (200 OK):

```json
{
  "stockId": "26f6de4c-3e38-46ad-a9da-5d1e6bb663ae",
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "bloodType": "O+",
  "quantityABefore": 0,
  "quantityAAfter": 0,
  "quantityBBefore": 0,
  "quantityBAfter": 0,
  "quantityABBefore": 0,
  "quantityABAfter": 0,
  "quantityOBefore": 50,
  "quantityOAfter": 60,
  "timestamp": "2025-02-27T14:30:00.000Z"
}
```

---

### 2. Ajustar Estoque (Saída de Bolsas)

**Cenário**: Transfusão de 3 bolsas de sangue A+ no Banco de Sangue

```bash
curl -X PATCH http://localhost:3000/stocks/5e3f1576-8d70-4b25-938e-f935ec26c2e1/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": -3,
    "actionBy": "doctor@bloodbank.com",
    "notes": "Transfusão para paciente ID 12345"
  }'
```

**Response** (200 OK):

```json
{
  "stockId": "5e3f1576-8d70-4b25-938e-f935ec26c2e1",
  "companyId": "550e8400-e29b-41d4-a716-446655440002",
  "bloodType": "AB+",
  "quantityABBefore": 8,
  "quantityABAfter": 5,
  "timestamp": "2025-02-27T14:35:00.000Z"
}
```

---

### 3. Erro: Estoque Insuficiente

**Cenário**: Tentativa de retirar 100 bolsas quando há apenas 15

```bash
curl -X PATCH http://localhost:3000/stocks/f528d719-41a8-4a0c-9d0d-ae7976240224/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": -100,
    "actionBy": "admin@hospital-b.com",
    "notes": "Emergência"
  }'
```

**Response** (400 Bad Request):

```json
{
  "statusCode": 400,
  "message": "Insufficient stock for blood type A+. Available: 15, Requested: 100",
  "error": "Bad Request",
  "details": {
    "bloodType": "A+",
    "available": 15,
    "requested": 100,
    "shortage": 85
  }
}
```

---

### 4. Erro: Validação de Input

**Cenário**: Movimentação de 0 bolsas (não permitido)

```bash
curl -X PATCH http://localhost:3000/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 0,
    "actionBy": "test@example.com"
  }'
```

**Response** (400 Bad Request):

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "movement",
      "value": 0,
      "constraints": {
        "isNotZero": "movement must not be equal to 0"
      }
    }
  ]
}
```

---

## ⚠️ Tratamento de Erros

A API utiliza códigos de status HTTP padronizados:

### Códigos de Sucesso

| Código | Descrição |
|--------|-----------|
| `200` | Requisição bem-sucedida |
| `201` | Recurso criado com sucesso |

### Códigos de Erro

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| `400` | **Bad Request** - Erro de validação ou regra de negócio | Estoque insuficiente, movimento = 0 |
| `404` | **Not Found** - Recurso não encontrado | Stock ID inválido |
| `422` | **Unprocessable Entity** - Dados inválidos | Campo obrigatório ausente |
| `500` | **Internal Server Error** - Erro interno do servidor | Falha no banco de dados |

### Estrutura de Erro Padrão

```typescript
{
  "statusCode": number,      // Código HTTP
  "message": string,         // Mensagem descritiva
  "error": string,           // Nome do erro
  "details"?: object         // Informações adicionais (opcional)
}
```

---

## 💡 Casos de Uso Comuns

### 🏥 Caso 1: Recebimento de Doação

**Contexto**: Hospital recebe doação de sangue

```bash
# Passo 1: Verificar estoque atual
GET /stocks/:stockId

# Passo 2: Registrar entrada
PATCH /stocks/:stockId/adjust
{
  "movement": 15,
  "actionBy": "reception@hospital.com",
  "notes": "Doação campanha #2025-02"
}

# Passo 3: Consultar histórico
GET /stocks/:stockId/movements
```

---

### 🚑 Caso 2: Transfusão de Emergência

**Contexto**: Paciente precisa de 5 bolsas de O+ urgentemente

```bash
# Passo 1: Verificar disponibilidade
GET /stocks?bloodType=O%2B&companyId=hospital-a

# Passo 2: Realizar saída
PATCH /stocks/:stockId/adjust
{
  "movement": -5,
  "actionBy": "dr.smith@hospital.com",
  "notes": "Emergência - Paciente ID 78901"
}

# Passo 3: Auditar movimentação
GET /stocks/:stockId/movements?limit=10
```

---

### 📊 Caso 3: Relatório de Movimentações

**Contexto**: Auditoria mensal de estoque

```bash
# Listar todos os estoques
GET /stocks?page=1&limit=50

# Para cada estoque, buscar movimentações
GET /stocks/:stockId/movements?limit=100

# Exportar dados para análise
curl http://localhost:3000/stocks/:stockId/movements > movements.json
```

---

## 🔬 IDs de Teste (Seed Data)

Os seguintes IDs estão disponíveis após executar o seed:

### Hospital A (ID: 550e8400-e29b-41d4-a716-446655440000)

| Tipo Sanguíneo | Stock ID |
|----------------|----------|
| O+ | `26f6de4c-3e38-46ad-a9da-5d1e6bb663ae` |
| A+ | `7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b` |
| B+ | `8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c` |

### Hospital B (ID: 550e8400-e29b-41d4-a716-446655440001)

| Tipo Sanguíneo | Stock ID |
|----------------|----------|
| A+ | `f528d719-41a8-4a0c-9d0d-ae7976240224` |
| O+ | `9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d` |

### Banco de Sangue (ID: 550e8400-e29b-41d4-a716-446655440002)

| Tipo Sanguíneo | Stock ID |
|----------------|----------|
| AB+ | `5e3f1576-8d70-4b25-938e-f935ec26c2e1` |
| O- | `0b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e` |

---

## 📚 Recursos Adicionais

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON**: [http://localhost:3000/api-docs-json](http://localhost:3000/api-docs-json)
- **Repositório GitHub**: https://github.com/bloodstock/blood-stock-service
- **Wiki**: https://github.com/bloodstock/blood-stock-service/wiki

---

## 🤝 Suporte

Para dúvidas ou problemas:

- 📧 Email: support@bloodstock.com
- 🐛 Issues: https://github.com/bloodstock/blood-stock-service/issues
- 💬 Discussões: https://github.com/bloodstock/blood-stock-service/discussions

---

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](../LICENSE) para detalhes.

---

**Última atualização**: 2025-02-27  
**Versão da API**: 1.0.0
