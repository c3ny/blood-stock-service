# 🔬 Análise de Redundância no Schema Stock - Blood Stock Service

## 📋 Sumário Executivo

**Status**: ❌ **REDUNDÂNCIA CRÍTICA IDENTIFICADA**

O modelo `Stock` atual possui uma **redundância fundamental** que torna impossível representar corretamente o estoque de sangue por tipo sanguíneo específico (A+, A-, B+, B-, AB+, AB-, O+, O-).

---

## 1️⃣ Redundância Identificada

### Modelo Atual (Problemático)

```prisma
model Stock {
  id          String    @id
  companyId   String
  bloodType   BloodType   // ← Especifica UM tipo: A_POS, A_NEG, etc.
  quantityA   Int         // ← Para tipo A (mas A+ ou A-? 🤔)
  quantityB   Int         // ← Para tipo B (mas B+ ou B-? 🤔)
  quantityAB  Int         // ← Para tipo AB (mas AB+ ou AB-? 🤔)
  quantityO   Int         // ← Para tipo O (mas O+ ou O-? 🤔)
}
```

### Tipos de Sangue (8 possíveis)
```typescript
enum BloodType {
  A_POS,   // A+
  A_NEG,   // A-
  B_POS,   // B+
  B_NEG,   // B-
  AB_POS,  // AB+
  AB_NEG,  // AB-
  O_POS,   // O+
  O_NEG    // O-
}
```

### O Problema

**Há 8 tipos de sangue, mas apenas 4 campos de quantidade!**

- `quantityA` → Deveria armazenar A+ **E** A-? Como diferenciar?
- `quantityB` → Deveria armazenar B+ **E** B-? Como diferenciar?
- `quantityAB` → Deveria armazenar AB+ **E** AB-? Como diferenciar?
- `quantityO` → Deveria armazenar O+ **E** O-? Como diferenciar?

**Resultado**: É **impossível** representar corretamente o estoque de cada tipo sanguíneo específico.

---

## 2️⃣ Problemas Causados

### A. **Ambiguidade de Dados** 🤯

**Exemplo de registro atual**:
```json
{
  "id": "123",
  "companyId": "empresa-1",
  "bloodType": "A_POS",
  "quantityA": 10,
  "quantityB": 5,
  "quantityAB": 3,
  "quantityO": 8
}
```

**Perguntas sem resposta**:
1. Se `bloodType = A_POS`, por que há `quantityB`, `quantityAB`, `quantityO`?
2. `quantityA = 10` representa:
   - Apenas A+? (então A- onde está?)
   - A+ e A- somados? (então como separar?)
   - Só o componente A do A+? (então AB não conta?)

**Impossível saber a resposta! ❌**

### B. **Violação de Integridade Referencial** 🚨

```typescript
// Tentativa de armazenar A+ quantidade 10
const stock = await prisma.stock.create({
  data: {
    companyId: "empresa-1",
    bloodType: "A_POS",
    quantityA: 10,   // ← OK, mas...
    quantityB: 0,    // ← Por que isso existe se bloodType é A?
    quantityAB: 0,
    quantityO: 0
  }
});

// E agora? Como armazenar A- para a mesma empresa?
// Opção 1: Criar outro Stock com bloodType = A_NEG
//          → Mas então você tem 2 records, cada um com 4 campos!
//          → quantityA no primeiro record é A+
//          → quantityA no segundo record é A-
//          → CONFUSO! 🤯

// Opção 2: Usar o mesmo Stock e quantityA armazena A+ e A- somados
//          → Então PERDE a granularidade! ❌
//          → Impossível saber quanto é A+ vs A-
```

### C. **Consultas Impossíveis** ❌

```typescript
// Quero buscar a quantidade de A+ para empresa-1
const stock = await prisma.stock.findFirst({
  where: {
    companyId: "empresa-1",
    bloodType: "A_POS"
  }
});

// Retorna um Stock, mas...
console.log(stock.quantityA);  // 10
// ↑ Isso é A+? Ou A+ + A-? Ou só componente A?
// IMPOSSÍVEL SABER! ❌
```

### D. **Lógica de Negócio Quebrada** 💔

```typescript
// Cliente doe 5 unidades de B+
// Como ajustar o estoque?

// Opção 1: Buscar por bloodType = B_POS
const stock = await findStock({ bloodType: "B_POS" });
await updateStock(stock.id, { 
  quantityB: stock.quantityB + 5  // ← Mas isso adiciona em B+ ou B-? 🤔
});

// Opção 2: Criar uma lógica complexa
if (bloodType.startsWith('B_')) {
  field = 'quantityB';
} else if (bloodType.startsWith('A_') && !bloodType.startsWith('AB_')) {
  field = 'quantityA';
} // ... etc.
// ↑ Ainda não resolve A+ vs A-! ❌
```

### E. **Espaço Desperdiçado** 💾

```sql
-- Para 1 empresa com estoque de apenas A+ = 10 unidades
INSERT INTO stock VALUES (
  '123',
  'empresa-1',
  'A_POS',
  10,   -- quantity_a (A+)
  0,    -- quantity_b (desperdiçado!)
  0,    -- quantity_ab (desperdiçado!)
  0     -- quantity_o (desperdiçado!)
);

-- 3 campos integer armazenando zeros inúteis!
-- Multiplique por milhares de empresas = muito espaço desperdiçado
```

### F. **Extensibilidade Impossível** 🚫

```typescript
// E se no futuro precisar adicionar um novo tipo de sangue?
// (ex: tipo raro como Bombay phenotype)

// Modelo atual: precisa adicionar novo campo quantity{Novo}
// ↓ Requer migration em TODOS os registros existentes
// ↓ Adiciona mais colunas desperdiçadas
// ↓ Aumenta complexidade da lógica

// Modelo otimizado: apenas adiciona novo enum value
// ↓ Nenhuma migration necessária
// ↓ Novos registros criados naturalmente
```

---

## 3️⃣ Solução Proposta: Normalização

### Princípio

**1 Stock = 1 Tipo de Sangue Específico**

Cada combinação única de `(companyId, bloodType)` deve ter **exatamente 1 registro** com **1 campo de quantidade**.

### Schema Otimizado

```prisma
model Stock {
  id          String          @id @db.Uuid
  companyId   String          @db.Uuid @map("company_id")
  bloodType   BloodType       @map("blood_type")
  quantity    Int             @default(0)  // ← UM único campo!
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")
  movements   StockMovement[]

  // ⭐ GARANTE 1 registro por empresa + tipo
  @@unique([companyId, bloodType])
  
  @@index([companyId])
  @@index([bloodType])
  @@index([createdAt])
  @@map("stock")
}
```

### Dados Representados

```typescript
// Empresa 1 com estoque de vários tipos
[
  { 
    id: "1", 
    companyId: "empresa-1", 
    bloodType: "A_POS", 
    quantity: 10   // ← Claramente A+
  },
  { 
    id: "2", 
    companyId: "empresa-1", 
    bloodType: "A_NEG", 
    quantity: 5    // ← Claramente A-
  },
  { 
    id: "3", 
    companyId: "empresa-1", 
    bloodType: "B_POS", 
    quantity: 8    // ← Claramente B+
  }
  // ... até 8 registros (um por tipo)
]
```

---

## 4️⃣ Comparação: Antes x Depois

| Critério | Modelo Atual (Redundante) | Modelo Otimizado |
|----------|---------------------------|------------------|
| **Registros/empresa** | 1 ou ??? (ambíguo) | 8 max (1 por tipo) |
| **Campos quantidade** | 4 (quantityA/B/AB/O) | 1 (quantity) |
| **Clareza** | ❌ Confuso | ✅ Cristalino |
| **Ambiguidade** | ❌ Alta (A+ vs A-?) | ✅ Zero |
| **Constraint** | ❌ Sem unique | ✅ `@@unique([companyId, bloodType])` |
| **Query simples** | ❌ Impossível | ✅ `WHERE companyId = X AND bloodType = Y` |
| **Waste de espaço** | ❌ 3 campos zerados por registro | ✅ Nenhum |
| **Extensibilidade** | ❌ Requer migration | ✅ Apenas novo enum |
| **Integridade** | ❌ Fraca | ✅ Forte com constraint |
| **Manutenção código** | ❌ Complexa | ✅ Simples |

---

## 5️⃣ Impacto na Aplicação

### Queries - ANTES (Impossível) ❌

```typescript
// Como buscar estoque de A+ para empresa-1?
// Tentativa 1:
const stock = await prisma.stock.findFirst({
  where: { companyId: "empresa-1", bloodType: "A_POS" }
});
// ↑ Retorna um Stock com quantityA
// Mas quantityA é A+ ou A+ + A-? AMBÍGUO!

// Tentativa 2:
const allStocks = await prisma.stock.findMany({
  where: { companyId: "empresa-1" }
});
// ↑ Retorna quantos? 1? 8?
// Como extrair A+ de dentro de quantityA? IMPOSSÍVEL!
```

### Queries - DEPOIS (Simples) ✅

```typescript
// Buscar estoque de A+ para empresa-1
const stock = await prisma.stock.findUnique({
  where: {
    companyId_bloodType: {  // ← Unique constraint
      companyId: "empresa-1",
      bloodType: "A_POS"
    }
  }
});
// ↑ Retorna EXATAMENTE o stock de A+
console.log(stock.quantity);  // 10 unidades de A+, SEM ambiguidade!
```

### Listagem - ANTES ❌

```typescript
// Listar todos os estoques da empresa-1
const stocks = await prisma.stock.findMany({
  where: { companyId: "empresa-1" }
});

// Quantos retorna? Depende de como foi implementado!
// Se 1 registro: Como separar os 8 tipos?
// Se 8 registros: Qual campo usar em cada? quantityA no primeiro é A+?
```

### Listagem - DEPOIS ✅

```typescript
// Listar todos os estoques da empresa-1
const stocks = await prisma.stock.findMany({
  where: { companyId: "empresa-1" },
  orderBy: { bloodType: 'asc' }
});

// Retorna array com 0-8 records (um por tipo sanguíneo)
// [
//   { bloodType: "A_NEG", quantity: 5 },
//   { bloodType: "A_POS", quantity: 10 },
//   { bloodType: "B_NEG", quantity: 3 },
//   ...
// ]
// CRISTALINO! ✅
```

### Ajuste de Estoque - ANTES ❌

```typescript
// Paciente recebe 5 unidades de B+
// Como atualizar?

// Impossível saber qual campo ajustar!
// quantityB contém B+ ou B- ou ambos? 🤷
```

### Ajuste de Estoque - DEPOIS ✅

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock específico para B+ da empresa-1
  const stock = await tx.stock.findUniqueOrThrow({
    where: {
      companyId_bloodType: {
        companyId: "empresa-1",
        bloodType: "B_POS"  // ← Específico e claro!
      }
    }
  });

  // 2. Validar quantidade suficiente
  if (stock.quantity < 5) {
    throw new InsufficientStockError("B+", stock.quantity, 5);
  }

  // 3. Atualizar estoque
  const updated = await tx.stock.update({
    where: { id: stock.id },
    data: { quantity: stock.quantity - 5 }
  });

  // 4. Registrar movimento
  await tx.stockMovement.create({
    data: {
      stockId: stock.id,
      movement: "OUT",
      quantityBefore: stock.quantity,
      quantityAfter: updated.quantity,
      actionBy: "PATIENT"
    }
  });
});
// ✅ Atômico, seguro, SEM ambiguidade!
```

---

## 6️⃣ Plano de Migration

### Desafio

**Como migrar dados de 4 campos para 8 registros?**

```sql
-- Dados ANTES (1 registro por empresa)
company_id   | blood_type | quantity_a | quantity_b | quantity_ab | quantity_o
-------------|------------|------------|------------|-------------|------------
empresa-1    | A_POS      | 10         | 5          | 3           | 8

-- Questão: quantityA = 10 é:
-- a) A+ = 10 (e A- = 0)
-- b) A+ = 5 e A- = 5 (50/50)
-- c) A+ + A- somados = 10 (sem separação)
-- d) Valor inconsistente (bug do sistema antigo)

-- Dados DEPOIS (8 registros por empresa)
company_id   | blood_type | quantity
-------------|------------|----------
empresa-1    | A_POS      | ???  ← De onde vem esse valor?
empresa-1    | A_NEG      | ???  ← De onde vem esse valor?
empresa-1    | B_POS      | ???
empresa-1    | B_NEG      | ???
empresa-1    | AB_POS     | ???
empresa-1    | AB_NEG     | ???
empresa-1    | O_POS      | ???
empresa-1    | O_NEG      | ???
```

### Opções de Migration

#### **Opção 1: Zerar Tudo (Recomendada se sistema novo)** ✅

```sql
-- Criar 8 registros com quantity = 0 para cada empresa
INSERT INTO stock (id, company_id, blood_type, quantity)
SELECT 
  gen_random_uuid(),
  c.id,
  bt.value,
  0
FROM company c
CROSS JOIN (
  SELECT unnest(enum_range(NULL::BloodType)) AS value
) bt;
```

**Vantagem**: Início limpo, sem ambiguidades  
**Desvantagem**: Perde dados históricos

#### **Opção 2: Distribuir Heuristicamente** ⚠️

```sql
-- Assumir 50/50 entre positivo e negativo
INSERT INTO stock (id, company_id, blood_type, quantity)
SELECT 
  gen_random_uuid(),
  s.company_id,
  'A_POS',
  s.quantity_a / 2
FROM stock_old s
UNION ALL
SELECT 
  gen_random_uuid(),
  s.company_id,
  'A_NEG',
  s.quantity_a / 2
FROM stock_old s;
-- Repetir para B, AB, O
```

**Vantagem**: Mantém alguma quantidade  
**Desvantagem**: Distribuição arbitrária (pode estar errada!)

#### **Opção 3: Migrar Como Soma** ⚠️

```sql
-- Colocar toda quantityA em A_POS e A_NEG = 0
INSERT INTO stock (id, company_id, blood_type, quantity)
VALUES 
  (uuid(), company_id, 'A_POS', quantity_a),
  (uuid(), company_id, 'A_NEG', 0),
  ...
```

**Vantagem**: Mantém total  
**Desvantagem**: Assume positivo, pode estar errado

#### **Opção 4: Analisar Histórico de Movimentos** 🔬

```sql
-- Reconstruir estoque com base em movimentos históricos
-- (se StockMovement contém bloodType correto)

CREATE TEMP TABLE reconstructed_stock AS
SELECT 
  company_id,
  blood_type,
  SUM(CASE WHEN movement = 'IN' THEN quantity ELSE -quantity END) AS quantity
FROM stock_movement sm
JOIN stock s ON sm.stock_id = s.id
GROUP BY company_id, blood_type;

-- Inserir dados reconstruídos
INSERT INTO stock (id, company_id, blood_type, quantity)
SELECT gen_random_uuid(), company_id, blood_type, quantity
FROM reconstructed_stock;
```

**Vantagem**: Dados precisos  
**Desvantagem**: Requer histórico completo e correto

### Migration Recomendada

```sql
-- Passo 1: Criar coluna temporária
ALTER TABLE stock ADD COLUMN quantity INTEGER DEFAULT 0;

-- Passo 2: DECISÃO MANUAL - escolher estratégia acima

-- Passo 3: Validação
SELECT company_id, COUNT(*) 
FROM stock 
GROUP BY company_id 
HAVING COUNT(*) != 8;
-- ↑ Deve retornar 0 rows (cada empresa tem exatamente 8 tipos)

-- Passo 4: Dropar colunas antigas
ALTER TABLE stock DROP COLUMN quantity_a;
ALTER TABLE stock DROP COLUMN quantity_b;
ALTER TABLE stock DROP COLUMN quantity_ab;
ALTER TABLE stock DROP COLUMN quantity_o;

-- Passo 5: Adicionar constraint
ALTER TABLE stock ADD CONSTRAINT stock_company_id_blood_type_key
  UNIQUE (company_id, blood_type);
```

---

## 7️⃣ Checklist de Ação

### Fase 1: Análise (COMPLETA) ✅
- [x] Identificar redundância
- [x] Documentar problemas
- [x] Propor solução

### Fase 2: Planejamento
- [ ] Decidir estratégia de migration
- [ ] Verificar dados existentes
- [ ] Analisar histórico de movimentos
- [ ] Definir tratamento de edge cases

### Fase 3: Implementação
- [ ] Criar novo schema Prisma
- [ ] Escrever migration SQL
- [ ] Atualizar DTOs (remover quantityA/B/AB/O)
- [ ] Refatorar use cases (usar quantity único)
- [ ] Atualizar repositories (queries com unique)

### Fase 4: Testing
- [ ] Testes unitários com novo schema
- [ ] Testes E2E com dados migrados
- [ ] Validar integridade referencial
- [ ] Performance test com índices novos

### Fase 5: Deploy
- [ ] Backup completo do banco
- [ ] Executar migration em staging
- [ ] Validar dados em staging
- [ ] Deploy para produção
- [ ] Monitorar erros

---

## 8️⃣ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Perda de dados na migration** | Média | Alto | Backup completo + teste em staging |
| **Queries antigas quebrarem** | Alta | Alto | Refatorar toda aplicação primeiro |
| **Performance degradation** | Baixa | Médio | Índices apropriados + testes de carga |
| **Downtime durante migration** | Baixa | Médio | Migration incremental ou blue-green deploy |

---

## 9️⃣ Benefícios Após Refatoração

### Técnicos ✅
- **Clareza**: 1 registro = 1 tipo sanguíneo (zero ambiguidade)
- **Integridade**: Unique constraint garante consistência
- **Simplicidade**: Queries diretas com `WHERE bloodType = X`
- **Extensibilidade**: Novos tipos = novos registros (sem migration)
- **Performance**: Índices otimizados + menos waste

### Negócio ✅
- **Confiabilidade**: Dados corretos e auditáveis
- **Escalabilidade**: Suporta crescimento sem redesign
- **Manutenibilidade**: Código mais simples = menos bugs
- **Reporting**: Queries analíticas triviais
- **Compliance**: Rastreabilidade clara por tipo

---

## 🎯 Conclusão

**Recomendação**: **REFATORAR IMEDIATAMENTE**

O schema atual com `quantityA/B/AB/O` torna **impossível** representar corretamente o estoque de sangue por tipo específico (A+, A-, etc.). 

A solução é **normalizar** para:
- 1 registro Stock = 1 combinação única de `(companyId, bloodType)`
- 1 campo `quantity` (em vez de 4)
- Constraint `@@unique([companyId, bloodType])`

**Próximo passo**: Decidir estratégia de migration e executar refatoração.

---

**Criado em**: 28 de fevereiro de 2026  
**Status**: ⚠️ **AÇÃO NECESSÁRIA**  
**Prioridade**: 🔴 **ALTA**
