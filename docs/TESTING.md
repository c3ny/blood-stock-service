# 🧪 Guia de Teste da API - Blood Stock Service

## 🚀 Acesso Rápido

**✅ A aplicação está rodando!**

- **Swagger UI**: http://localhost:3000/api-docs
- **API Base**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## 🩺 1. Testar Health Check

### Via Swagger UI

1. Acesse http://localhost:3000/api-docs
2. Expanda **Sistema → GET /health**
3. Clique em **"Try it out"**
4. Clique em **"Execute"**

### Via cURL

```bash
curl http://localhost:3000/health
```

**Resposta esperada** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T19:31:30.000Z",
  "uptime": 120,
  "version": "1.0.0",
  "services": {
    "database": "up",
    "api": "up"
  }
}
```

---

## 🩸 2. Testar Ajuste de Estoque

### IDs de Teste (Seed Data)

Os seguintes IDs estão disponíveis para testes:

| Hospital/Banco | Tipo Sanguíneo | Stock ID | Quantidade Inicial |
|----------------|----------------|----------|-------------------|
| Hospital A | O+ | `26f6de4c-3e38-46ad-a9da-5d1e6bb663ae` | 50 bolsas |
| Hospital B | A+ | `f528d719-41a8-4a0c-9d0d-ae7976240224` | 15 bolsas |
| Banco de Sangue | AB+ | `5e3f1576-8d70-4b25-938e-f935ec26c2e1` | 8 bolsas |

---

### Cenário 1: Entrada de Bolsas (Doação)

**Objetivo**: Registrar entrada de 10 bolsas de O+ no Hospital A

#### Via Swagger UI

1. Acesse http://localhost:3000/api-docs
2. Expanda **Estoque de Sangue → PATCH /stocks/{stockId}/adjust**
3. Clique em **"Try it out"**
4. Preencha:
   - **stockId**: `26f6de4c-3e38-46ad-a9da-5d1e6bb663ae`
   - **Request body**:
     ```json
     {
       "movement": 10,
       "actionBy": "admin@hospital-a.com",
       "notes": "Doação da campanha de janeiro"
     }
     ```
5. Clique em **"Execute"**

#### Via cURL

```bash
curl -X PATCH http://localhost:3000/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 10,
    "actionBy": "admin@hospital-a.com",
    "notes": "Doação da campanha de janeiro"
  }'
```

**Resposta esperada** (200 OK):

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
  "timestamp": "2026-02-27T20:00:00.000Z"
}
```

---

### Cenário 2: Saída de Bolsas (Transfusão)

**Objetivo**: Registrar saída de 3 bolsas de A+ do Hospital B

#### Via Swagger UI

1. No Swagger UI, expanda **PATCH /stocks/{stockId}/adjust**
2. Clique em **"Try it out"**
3. Preencha:
   - **stockId**: `f528d719-41a8-4a0c-9d0d-ae7976240224`
   - **Request body**:
     ```json
     {
       "movement": -3,
       "actionBy": "dr.silva@hospital-b.com",
       "notes": "Transfusão para paciente ID 12345"
     }
     ```
4. Clique em **"Execute"**

#### Via cURL

```bash
curl -X PATCH http://localhost:3000/stocks/f528d719-41a8-4a0c-9d0d-ae7976240224/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": -3,
    "actionBy": "dr.silva@hospital-b.com",
    "notes": "Transfusão para paciente ID 12345"
  }'
```

**Resposta esperada** (200 OK):

```json
{
  "stockId": "f528d719-41a8-4a0c-9d0d-ae7976240224",
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "bloodType": "A+",
  "quantityABefore": 15,
  "quantityAAfter": 12,
  "quantityBBefore": 0,
  "quantityBAfter": 0,
  "quantityABBefore": 0,
  "quantityABAfter": 0,
  "quantityOBefore": 0,
  "quantityOAfter": 0,
  "timestamp": "2026-02-27T20:05:00.000Z"
}
```

---

### Cenário 3: Erro - Estoque Insuficiente

**Objetivo**: Testar validação de estoque insuficiente

#### Via cURL

```bash
curl -X PATCH http://localhost:3000/stocks/5e3f1576-8d70-4b25-938e-f935ec26c2e1/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": -100,
    "actionBy": "admin@bloodbank.com",
    "notes": "Tentativa de retirar mais do que existe"
  }'
```

**Resposta esperada** (400 Bad Request):

```json
{
  "message": "Insufficient stock for blood type AB+. Available: 8, Requested: 100",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### Cenário 4: Erro - Validação de Input

**Objetivo**: Testar validação de dados (movimento = 0)

#### Via cURL

```bash
curl -X PATCH http://localhost:3000/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 0,
    "actionBy": "test@example.com"
  }'
```

**Resposta esperada** (400 Bad Request):

```json
{
  "message": ["movement must not be equal to 0"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### Cenário 5: Erro - Stock ID Inválido

**Objetivo**: Testar resposta para ID inexistente

#### Via cURL

```bash
curl -X PATCH http://localhost:3000/stocks/00000000-0000-0000-0000-000000000000/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "movement": 5,
    "actionBy": "admin@example.com",
    "notes": "Teste"
  }'
```

**Resposta esperada** (404 Not Found):

```json
{
  "message": "Stock not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 📊 3. Endpoints Documentados (Em Desenvolvimento)

Os seguintes endpoints estão **documentados no Swagger**, mas **ainda não implementados**:

### GET /stocks

Lista todos os estoques com filtros opcionais:
- `companyId` (UUID)
- `bloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `page` (número da página)
- `limit` (itens por página)

**Status**: 🚧 Em desenvolvimento (retorna erro 500)

---

### GET /stocks/:stockId

Busca um estoque específico por ID.

**Status**: 🚧 Em desenvolvimento (retorna erro 500)

---

### GET /stocks/:stockId/movements

Lista histórico de movimentações de um estoque.

**Parâmetros**:
- `stockId` (UUID, obrigatório)
- `limit` (número, opcional)

**Status**: 🚧 Em desenvolvimento (retorna erro 500)

---

## 🔍 4. Verificar Dados no Banco

### Acessar Prisma Studio

```bash
npx prisma studio
```

Abre GUI em http://localhost:5555 com tabelas:
- **Stock** - Estoques
- **StockMovement** - Movimentações
- **Batch** - Lotes
- **Company** - Empresas

### Via PostgreSQL CLI

```bash
# Acessar container do banco
docker exec -it bloodstock-db psql -U postgres -d bloodstock

# Consultar estoques
SELECT id, "companyId", "bloodType", "quantityO", "quantityA", "quantityB", "quantityAB" FROM "Stock";

# Consultar movimentações
SELECT id, "stockId", movement, "quantityBefore", "quantityAfter", "actionBy", notes, "createdAt" FROM "StockMovement" ORDER BY "createdAt" DESC;

# Sair
\q
```

---

## 📦 5. Exportar Especificação OpenAPI

### JSON (para import em Postman/Insomnia)

```bash
curl http://localhost:3000/api-docs-json > openapi.json
```

### YAML (para documentação)

```bash
curl http://localhost:3000/api-docs-yaml > openapi.yaml
```

---

## 🛠️ 6. Comandos Úteis Docker

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Reiniciar containers
docker-compose restart

# Parar containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Reconstruir após mudanças
docker-compose up --build
```

---

## ✅ Checklist de Validação

Marque os testes realizados:

- [ ] Health check retorna status "healthy"
- [ ] Entrada de bolsas (movimento positivo) funciona
- [ ] Saída de bolsas (movimento negativo) funciona
- [ ] Erro de estoque insuficiente é exibido corretamente
- [ ] Erro de validação (movimento = 0) é exibido
- [ ] Erro 404 para Stock ID inexistente
- [ ] Swagger UI está acessível e documentação completa
- [ ] Health check mostra database: "up"
- [ ] Quantidades before/after estão corretas na resposta

---

## 🎯 Próximos Passos

Para desenvolvimento futuro:

1. **Implementar endpoints GET** (listar, buscar por ID, movimentações)
2. **Adicionar autenticação JWT** (Bearer token)
3. **Adicionar endpoint de relatórios** (estatísticas, gráficos)
4. **Implementar cache Redis** (para queries frequentes)
5. **Adicionar testes E2E** (Supertest + Jest)
6. **Configurar CI/CD** (GitHub Actions, GitLab CI)
7. **Deploy em produção** (AWS ECS, Kubernetes, Railway)

---

## 📞 Suporte

- **Documentação completa**: [docs/API.md](API.md)
- **Swagger UI**: http://localhost:3000/api-docs
- **Issues**: https://github.com/bloodstock/blood-stock-service/issues

---

**Desenvolvido com ❤️ usando NestJS + Clean Architecture**
