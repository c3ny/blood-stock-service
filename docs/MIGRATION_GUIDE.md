# 🔄 Guia de Migração - Schema Refatorado

## 📋 Visão Geral

Este documento detalha o processo de migração do schema antigo (com `Stock`, `Batch` e `StockMovement`) para o novo schema normalizado (com `Company`, `User`, `Batch`, `BloodBag`, `Movement` e `StockView`).

---

## ⚠️ AVISOS IMPORTANTES

- **BREAKING CHANGES**: Este é um redesign completo do schema
- **Backup Obrigatório**: Faça backup completo antes de iniciar
- **Downtime**: Haverá período de indisponibilidade durante migração
- **Teste em Staging**: Execute todos os passos em ambiente de teste primeiro
- **Reversão**: Prepare plano de rollback antes de executar em produção

---

## 📊 Comparação de Modelos

### Schema Antigo (Problemático)

```prisma
model Stock {
  id         String
  companyId  String  // ← Sem FK para Company (não existe)
  bloodType  BloodType
  quantityA  Int     // ← Redundante com bloodType
  quantityB  Int     // ← Impossível diferenciar A+ de A-
  quantityAB Int
  quantityO  Int
  movements  StockMovement[]
}

model Batch {
  id            String
  companyId     String
  code          String
  bloodType     BloodType
  entryQuantity Int  // ← Apenas agregado, sem bolsas individuais
  exitQuantity  Int
}

model StockMovement {
  id             String
  stockId        String
  movement       Int     // ← Ambíguo: +5 ou -5?
  quantityBefore Int
  quantityAfter  Int
  actionBy       String  // ← Sem FK para User
  notes          String
}
```

### Schema Novo (Normalizado)

```prisma
model Company {
  id       String
  name     String
  cnpj     String @unique
  // ... campos completos
  batches  Batch[]
  users    User[]
}

model User {
  id        String
  companyId String  // ← FK para Company
  name      String
  email     String @unique
  role      UserRole
  company   Company @relation(...)
  movements Movement[]
}

model Batch {
  id         String
  companyId  String  // ← FK para Company
  code       String
  bloodType  BloodType
  receivedAt DateTime
  expiresAt  DateTime
  company    Company @relation(...)
  bloodBags  BloodBag[]  // ← Relacionamento 1:N
}

model BloodBag {  // ← NOVO!
  id        String
  batchId   String
  bagCode   String @unique
  bloodType BloodType
  volume    Int
  status    BloodBagStatus
  expiresAt DateTime
  batch     Batch @relation(...)
  movements Movement[]
}

model Movement {  // ← Refatorado
  id          String
  companyId   String  // ← FK para Company
  bloodBagId  String? // ← FK para BloodBag
  userId      String  // ← FK para User
  type        MovementType  // ← Enum em vez de Int
  bloodType   BloodType
  origin      String?
  destination String?
  company     Company @relation(...)
  bloodBag    BloodBag? @relation(...)
  user        User @relation(...)
}

model StockView {  // ← Materializada
  id               String
  companyId        String
  bloodType        BloodType
  availableCount   Int
  reservedCount    Int
  totalVolume      Int
  company          Company @relation(...)
  
  @@unique([companyId, bloodType])
}
```

---

## 🗺️ Estratégias de Migração

### Opção 1: Reset Completo ✅ (Recomendado para Sistemas Novos)

**Quando Usar**:
- Sistema está em desenvolvimento/teste
- Não há dados críticos de produção
- Prefere começar limpo

**Passos**:

```bash
# 1. Backup do schema antigo (precaução)
pg_dump -U postgres -d bloodstock > backup_$(date +%Y%m%d).sql

# 2. Dropar tabelas antigas
psql -U postgres -d bloodstock -c "DROP TABLE IF EXISTS stock CASCADE;"
psql -U postgres -d bloodstock -c "DROP TABLE IF EXISTS bloodstock_movement CASCADE;"
psql -U postgres -d bloodstock -c "DROP TABLE IF EXISTS batch CASCADE;"

# 3. Substituir schema
cp prisma/schema-refactored.prisma prisma/schema.prisma

# 4. Criar nova migration
npx prisma migrate dev --name refactor_complete_schema

# 5. Gerar Prisma Client
npx prisma generate

# 6. Executar seed (dados iniciais)
npx prisma db seed
```

**Vantagens**:
- ✅ Sem complexidade de transformação de dados
- ✅ Schema limpo sem inconsistências
- ✅ Rápido

**Desvantagens**:
- ❌ Perde dados existentes

---

### Opção 2: Migração de Dados com Transformação ⚠️

**Quando Usar**:
- Há dados históricos importantes
- Precisa manter histórico de lotes/movimentações
- Produção ativa

**Desafios**:

1. **Company**: Schema antigo não tem tabela Company
2. **User**: Schema antigo não tem tabela User
3. **BloodBag**: Schema antigo não rastreia bolsas individuais
4. **Stock → StockView**: Transformar agregados em bolsas individuais

#### Passo 1: Preparação (Antes da Migração)

**1.1 Criar Mapeamento de Companies**

```sql
-- Criar tabela temporária para mapear companyIds existentes
CREATE TABLE temp_company_mapping (
  old_company_id UUID PRIMARY KEY,
  new_company_id UUID NOT NULL,
  company_name VARCHAR(255),
  cnpj VARCHAR(18)
);

-- Popular manualmente ou via script
INSERT INTO temp_company_mapping (old_company_id, new_company_id, company_name, cnpj)
VALUES 
  ('company-uuid-1', gen_random_uuid(), 'Hemocentro Central', '00.000.000/0001-00'),
  ('company-uuid-2', gen_random_uuid(), 'Hemocentro Norte', '00.000.000/0002-00');
```

**1.2 Criar Usuário Default para Movimentações**

```sql
-- Criar user "System Migration" para movimentações antigas
INSERT INTO user (id, company_id, name, email, role, password)
SELECT 
  gen_random_uuid(),
  new_company_id,
  'Sistema - Migração',
  'migration@system.local',
  'ADMIN',
  '$2b$10$...' -- hash de senha aleatória
FROM temp_company_mapping;
```

#### Passo 2: Migração de Batch

```sql
-- Migrar lotes existentes para nova estrutura
INSERT INTO batch (
  id,
  company_id,
  code,
  blood_type,
  received_at,
  expires_at,
  donor_reference,
  notes,
  created_at,
  updated_at
)
SELECT 
  b.id,
  tcm.new_company_id,
  b.code,
  b.blood_type,
  b.created_at,  -- Assumir created_at como data de recebimento
  b.created_at + INTERVAL '30 days',  -- ⚠️ ASSUMIR 30 dias de validade!
  NULL,  -- Não temos donor_reference no schema antigo
  'Migrado do sistema antigo',
  b.created_at,
  b.updated_at
FROM batch_old b
JOIN temp_company_mapping tcm ON b.company_id = tcm.old_company_id;
```

#### Passo 3: Criar BloodBags a partir de Batch

**Problema**: Schema antigo tem apenas `entryQuantity` e `exitQuantity`, não bolsas individuais.

**Solução Heurística**:

```sql
-- Para cada lote, criar N bolsas baseado em entryQuantity
DO $$
DECLARE
  batch_record RECORD;
  bag_index INT;
  bag_status blood_bag_status_enum;
BEGIN
  FOR batch_record IN 
    SELECT id, company_id, blood_type, entry_quantity, exit_quantity, expires_at
    FROM batch
  LOOP
    -- Criar bolsas disponíveis (entry - exit)
    FOR bag_index IN 1..batch_record.entry_quantity LOOP
      -- Determinar status da bolsa
      IF bag_index <= batch_record.exit_quantity THEN
        bag_status := 'USED';  -- Bolsas já saíram
      ELSE
        bag_status := 'AVAILABLE';  -- Bolsas ainda disponíveis
      END IF;

      -- Criar bolsa
      INSERT INTO blood_bag (
        id,
        batch_id,
        bag_code,
        blood_type,
        volume,
        status,
        expires_at,
        notes,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        batch_record.id,
        'MIGRATED-' || batch_record.id || '-' || bag_index,
        batch_record.blood_type,
        450,  -- ⚠️ Assumir 450mL padrão
        bag_status,
        batch_record.expires_at,
        'Bolsa criada durante migração',
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;
```

**⚠️ ATENÇÃO**: Esta é uma **aproximação**. Não temos dados reais de cada bolsa individual!

#### Passo 4: Migrar StockMovement → Movement

```sql
-- Migrar movimentações antigas
INSERT INTO movement (
  id,
  company_id,
  blood_bag_id,  -- ⚠️ NULL pois não temos bolsa específica
  user_id,       -- ⚠️ User "Sistema - Migração"
  type,          -- ⚠️ Interpretar a partir do campo "movement"
  blood_type,    -- ⚠️ Precisamos deduzir do Stock
  quantity,
  notes,
  created_at
)
SELECT 
  sm.id,
  s.company_id,
  NULL,  -- ⚠️ Movimento antigo não referencia bolsa específica
  (SELECT id FROM user WHERE email = 'migration@system.local' LIMIT 1),  -- ⚠️ User default
  CASE 
    WHEN sm.movement > 0 THEN 'ENTRY_DONATION'::movement_type_enum
    WHEN sm.movement < 0 THEN 'EXIT_TRANSFUSION'::movement_type_enum
    ELSE 'ADJUSTMENT'::movement_type_enum
  END,
  s.blood_type,  -- ⚠️ PROBLEMA: Stock antigo tem bloodType mas quantityA/B/AB/O
  ABS(sm.movement),
  sm.notes || ' (Migrado: actionBy=' || sm.action_by || ')',
  sm.created_at
FROM bloodstock_movement sm
JOIN stock_old s ON sm.stock_id = s.id;
```

**⚠️ PROBLEMA CRÍTICO**: 
- Stock antigo tem `bloodType = A_POS` mas movimento pode ter afetado `quantityB`!
- **Impossível** mapear corretamente sem dados adicionais.

**Solução**: 
1. **Aceitar perda de precisão** (assumir bloodType do Stock)
2. **Ou** adicionar nota no movimento: "Tipo sanguíneo inferido, verifique manual"

#### Passo 5: Calcular StockView

```sql
-- Recalcular StockView a partir de BloodBags
INSERT INTO stock_view (
  id,
  company_id,
  blood_type,
  available_count,
  reserved_count,
  used_count,
  expired_count,
  total_volume,
  available_volume,
  last_updated
)
SELECT 
  gen_random_uuid(),
  b.company_id,
  bb.blood_type,
  COUNT(*) FILTER (WHERE bb.status = 'AVAILABLE') AS available_count,
  COUNT(*) FILTER (WHERE bb.status = 'RESERVED') AS reserved_count,
  COUNT(*) FILTER (WHERE bb.status = 'USED') AS used_count,
  COUNT(*) FILTER (WHERE bb.status = 'EXPIRED') AS expired_count,
  SUM(bb.volume) AS total_volume,
  SUM(bb.volume) FILTER (WHERE bb.status = 'AVAILABLE') AS available_volume,
  NOW()
FROM blood_bag bb
JOIN batch b ON bb.batch_id = b.id
GROUP BY b.company_id, bb.blood_type
ON CONFLICT (company_id, blood_type) DO UPDATE
SET 
  available_count = EXCLUDED.available_count,
  reserved_count = EXCLUDED.reserved_count,
  used_count = EXCLUDED.used_count,
  total_volume = EXCLUDED.total_volume,
  available_volume = EXCLUDED.available_volume,
  last_updated = NOW();
```

---

## 🔧 Script de Migração Completo

```bash
#!/bin/bash
# migration-script.sh

set -e  # Exit on error

echo "🚀 Iniciando migração do Blood Stock Service..."

# 1. Backup
echo "📦 Criando backup..."
pg_dump -U postgres -d bloodstock > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Renomear tabelas antigas
echo "📝 Renomeando tabelas antigas..."
psql -U postgres -d bloodstock <<SQL
  ALTER TABLE stock RENAME TO stock_old;
  ALTER TABLE bloodstock_movement RENAME TO bloodstock_movement_old;
  ALTER TABLE batch RENAME TO batch_old;
SQL

# 3. Aplicar novo schema
echo "🔨 Aplicando novo schema..."
cp prisma/schema-refactored.prisma prisma/schema.prisma
npx prisma migrate deploy

# 4. Executar SQL de transformação de dados
echo "🔄 Transformando dados..."
psql -U postgres -d bloodstock -f migration-data-transform.sql

# 5. Validar integridade
echo "✅ Validando integridade..."
psql -U postgres -d bloodstock -f validation-checks.sql

# 6. Atualizar StockView
echo "📊 Recalculando StockView..."
psql -U postgres -d bloodstock -f recalculate-stock-view.sql

echo "✅ Migração concluída!"
echo "⚠️  Verificar logs e validações antes de dropar tabelas antigas."
```

---

## ✅ Validações Pós-Migração

### validation-checks.sql

```sql
-- 1. Verificar que todas Company têm ao menos 1 User
SELECT 
  c.id AS company_id,
  c.name,
  COUNT(u.id) AS user_count
FROM company c
LEFT JOIN user u ON c.id = u.company_id
GROUP BY c.id, c.name
HAVING COUNT(u.id) = 0;
-- Expected: 0 rows

-- 2. Verificar que todos Batch têm ao menos 1 BloodBag
SELECT 
  b.id AS batch_id,
  b.code,
  COUNT(bb.id) AS bag_count
FROM batch b
LEFT JOIN blood_bag bb ON b.id = bb.batch_id
GROUP BY b.id, b.code
HAVING COUNT(bb.id) = 0;
-- Expected: 0 rows

-- 3. Verificar consistência de bloodType entre Batch e BloodBag
SELECT 
  bb.id AS blood_bag_id,
  bb.blood_type AS bag_type,
  b.blood_type AS batch_type
FROM blood_bag bb
JOIN batch b ON bb.batch_id = b.id
WHERE bb.blood_type != b.blood_type;
-- Expected: 0 rows

-- 4. Verificar que StockView está correto
SELECT 
  sv.company_id,
  sv.blood_type,
  sv.available_count AS stock_view_count,
  COUNT(*) FILTER (WHERE bb.status = 'AVAILABLE') AS actual_count
FROM stock_view sv
JOIN blood_bag bb ON sv.company_id = (SELECT company_id FROM batch WHERE id = bb.batch_id)
  AND sv.blood_type = bb.blood_type
GROUP BY sv.company_id, sv.blood_type, sv.available_count
HAVING sv.available_count != COUNT(*) FILTER (WHERE bb.status = 'AVAILABLE');
-- Expected: 0 rows

-- 5. Verificar FKs órfãs
SELECT 'blood_bag' AS table_name, COUNT(*) AS orphans
FROM blood_bag bb
LEFT JOIN batch b ON bb.batch_id = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 'movement', COUNT(*)
FROM movement m
LEFT JOIN company c ON m.company_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 'user', COUNT(*)
FROM user u
LEFT JOIN company c ON u.company_id = c.id
WHERE c.id IS NULL;
-- Expected: All counts = 0
```

---

## 🔙 Rollback Plan

Se algo der errado:

```bash
#!/bin/bash
# rollback.sh

echo "⚠️  Executando rollback..."

# 1. Restaurar backup
pg_restore -U postgres -d bloodstock backup_YYYYMMDD_HHMMSS.sql

# 2. Reverter schema
git checkout HEAD~1 prisma/schema.prisma
npx prisma generate

echo "✅ Rollback concluído. Sistema restaurado."
```

---

## 📋 Checklist de Migração

### Pré-Migração
- [ ] Backup completo do banco de dados
- [ ] Schema refatorado testado em ambiente de desenvolvimento
- [ ] Queries de transformação de dados revisadas
- [ ] Validações SQL preparadas
- [ ] Rollback plan documentado e testado
- [ ] Janela de manutenção agendada
- [ ] Comunicação enviada para stakeholders

### Durante Migração
- [ ] Colocar sistema em modo de manutenção
- [ ] Executar backup final antes de iniciar
- [ ] Renomear tabelas antigas (_old)
- [ ] Aplicar novo schema (Prisma migrate)
- [ ] Executar scripts de transformação de dados
- [ ] Executar validações SQL
- [ ] Recalcular StockView
- [ ] Testes de sanidade (queries básicas)

### Pós-Migração
- [ ] Validar integridade referencial
- [ ] Validar contadores (StockView vs BloodBag)
- [ ] Testar fluxos principais (entrada/saída)
- [ ] Monitorar logs de erro
- [ ] Validar performance de queries
- [ ] Liberar sistema para uso
- [ ] Monitorar por 24h
- [ ] Dropar tabelas _old (após 1 semana sem incidentes)

---

## ⏱️ Estimativa de Tempo

| Etapa | Tempo Estimado |
|-------|----------------|
| Preparação (scripts, testes) | 3-5 dias |
| Backup | 10-30 min |
| Aplicar schema | 5 min |
| Transformação de dados | 1-4 horas (depende do volume) |
| Validações | 30 min |
| Testes | 1-2 horas |
| **Total** | **4-6 dias (preparação) + 3-7 horas (execução)** |

---

## 🎯 Recomendação Final

**Para sistema em produção**: Opção 2 (Migração com Transformação)  
**Para sistema novo/dev**: Opção 1 (Reset Completo)

**Próximos Passos**:
1. Executar migração em ambiente de staging primeiro
2. Validar transformação de dados com stakeholders
3. Ajustar scripts conforme necessário
4. Agendar janela de manutenção para produção
5. Executar migração em produção

---

**Dúvidas?** Consulte [COMPLETE_SCHEMA_ANALYSIS.md](./COMPLETE_SCHEMA_ANALYSIS.md) para detalhes técnicos.
