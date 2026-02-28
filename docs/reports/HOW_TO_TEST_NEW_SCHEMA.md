# Como Testar o Novo Schema

## 🚦 Guia Rápido de Teste

### 1️⃣ Aplicar Schema Refatorado

```bash
# Backup do schema atual
cp prisma/schema.prisma prisma/schema-OLD.prisma.bak

# Aplicar novo schema
cp prisma/schema-refactored.prisma prisma/schema.prisma

# Criar migração
npx prisma migrate dev --name refactor_blood_stock_complete

# Gerar cliente Prisma
npx prisma generate
```

### 2️⃣ Popular com Dados de Teste

Crie `prisma/seed-refactored.ts`:

```typescript
import { PrismaClient, BloodType, BloodBagStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Criar empresa
  const company = await prisma.company.create({
    data: {
      name: 'Hemocentro São Paulo (TESTE)',
      cnpj: '00.000.000/0001-00',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 3000-0000',
      email: 'teste@hemocentro.org.br',
    },
  });

  console.log('✅ Empresa criada:', company.name);

  // 2. Criar usuário
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36YQvJg.8z9Z9k6W5oWz9G6', // senha: "test123"
      role: 'ADMIN',
      cpf: '000.000.000-00',
    },
  });

  console.log('✅ Usuário criado:', user.name);

  // 3. Criar lote com bolsas
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias

  const batch = await prisma.batch.create({
    data: {
      companyId: company.id,
      code: `LOTE-TEST-${Date.now()}`,
      bloodType: BloodType.O_POS,
      receivedAt: now,
      expiresAt,
      donorReference: 'DOACAO-TESTE-001',
      sourceLocation: 'Campanha Shopping',
    },
  });

  console.log('✅ Lote criado:', batch.code);

  // 4. Criar 5 bolsas no lote
  const bloodBags = await Promise.all(
    Array.from({ length: 5 }, async (_, i) => {
      return await prisma.bloodBag.create({
        data: {
          batchId: batch.id,
          bagCode: `${batch.code}-${String.fromCharCode(65 + i)}`, // A, B, C, D, E
          bloodType: BloodType.O_POS,
          volume: 450,
          status: BloodBagStatus.AVAILABLE,
          expiresAt,
        },
      });
    })
  );

  console.log(`✅ ${bloodBags.length} bolsas criadas`);

  // 5. Criar StockView
  const stockView = await prisma.stockView.create({
    data: {
      companyId: company.id,
      bloodType: BloodType.O_POS,
      availableCount: 5,
      totalVolume: 5 * 450,
      availableVolume: 5 * 450,
      oldestExpirationDate: expiresAt,
    },
  });

  console.log('✅ StockView criado');

  console.log('\n🎉 Seed completo!');
  console.log('📊 Resumo:');
  console.log(`   - Empresa: ${company.name}`);
  console.log(`   - Usuário: ${user.email}`);
  console.log(`   - Lote: ${batch.code}`);
  console.log(`   - Bolsas: ${bloodBags.length}`);
  console.log(`   - Estoque O+: ${stockView.availableCount} bolsas\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
# Executar seed
npx ts-node prisma/seed-refactored.ts
```

### 3️⃣ Testar Queries

Crie `test-queries.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQueries() {
  console.log('\n🧪 Testando Queries...\n');

  // 1. Listar estoque
  const stock = await prisma.stockView.findMany({
    include: {
      company: { select: { name: true } },
    },
  });

  console.log('📊 ESTOQUE:');
  stock.forEach(s => {
    console.log(`   ${s.bloodType}: ${s.availableCount} disponíveis (${s.availableVolume}mL)`);
  });

  // 2. Listar bolsas disponíveis (FIFO)
  const bags = await prisma.bloodBag.findMany({
    where: {
      status: 'AVAILABLE',
    },
    include: {
      batch: { select: { code: true } },
    },
    orderBy: {
      expiresAt: 'asc', // FIFO
    },
  });

  console.log('\n🩸 BOLSAS DISPONÍVEIS (FIFO):');
  bags.forEach((b, i) => {
    console.log(`   ${i + 1}. ${b.bagCode} - Vence em ${b.expiresAt.toISOString().split('T')[0]}`);
  });

  // 3. Buscar bolsas vencendo em 7 dias
  const expiringSoon = await prisma.bloodBag.findMany({
    where: {
      status: 'AVAILABLE',
      expiresAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`\n⚠️  VENCENDO EM 7 DIAS: ${expiringSoon.length} bolsas`);

  await prisma.$disconnect();
}

testQueries();
```

```bash
npx ts-node test-queries.ts
```

### 4️⃣ Testar Fluxo Completo

```typescript
import {
  createCompany,
  createUser,
  registerBatchEntry,
  registerTransfusion,
  getStockSummary,
} from './src/examples/queries-refactored';

async function testFullFlow() {
  // 1. Setup
  const company = await createCompany();
  const user = await createUser(company.id);

  // 2. Entrada de lote
  const entry = await registerBatchEntry(company.id, user.id, 'A_POS', 10);
  console.log(`✅ ${entry.bloodBags.length} bolsas de A+ registradas`);

  // 3. Consultar estoque
  const stock = await getStockSummary(company.id, 'A_POS');
  console.log(`📊 Estoque: ${stock?.availableCount} disponíveis`);

  // 4. Transfusão
  const transfusion = await registerTransfusion(
    company.id,
    'A_POS',
    'paciente-001',
    user.id
  );
  console.log(`💉 Bolsa ${transfusion.bloodBag.bagCode} usada em transfusão`);

  // 5. Verificar estoque final
  const finalStock = await getStockSummary(company.id, 'A_POS');
  console.log(`📊 Estoque final: ${finalStock?.availableCount} disponíveis`);
}

testFullFlow();
```

## 🔍 Queries SQL Úteis

### Ver todas as tabelas
```sql
\dt
```

### Ver estoque atual
```sql
SELECT 
  c.name AS empresa,
  sv.blood_type,
  sv.available_count,
  sv.reserved_count,
  sv.used_count,
  sv.available_volume
FROM "StockView" sv
JOIN "Company" c ON c.id = sv.company_id;
```

### Ver bolsas por status
```sql
SELECT 
  status,
  blood_type,
  COUNT(*) AS quantidade,
  SUM(volume) AS volume_total
FROM "BloodBag"
GROUP BY status, blood_type
ORDER BY blood_type, status;
```

### Próximas bolsas a vencer (FIFO)
```sql
SELECT 
  bb.bag_code,
  bb.blood_type,
  bb.status,
  bb.expires_at,
  b.code AS lote
FROM "BloodBag" bb
JOIN "Batch" b ON b.id = bb.batch_id
WHERE bb.status = 'AVAILABLE'
  AND bb.expires_at >= NOW()
ORDER BY bb.expires_at ASC
LIMIT 10;
```

### Histórico de movimentos
```sql
SELECT 
  m.created_at,
  m.type,
  m.blood_type,
  u.name AS usuario,
  bb.bag_code,
  m.notes
FROM "Movement" m
JOIN "User" u ON u.id = m.user_id
JOIN "BloodBag" bb ON bb.id = m.blood_bag_id
ORDER BY m.created_at DESC
LIMIT 20;
```

## 🎯 Checklist de Validação

Após executar os testes, valide:

- [ ] Schema aplicado sem erros (`npx prisma migrate dev`)
- [ ] Seed executou com sucesso (empresa + usuário + lote + bolsas criados)
- [ ] Query de estoque retorna dados corretos
- [ ] FIFO funciona (bolsas ordenadas por `expiresAt ASC`)
- [ ] Transfusão atualiza status da bolsa e StockView
- [ ] Reserva funciona corretamente
- [ ] Alertas de vencimento são criados
- [ ] Relatórios de movimento funcionam
- [ ] Indexes estão criados (verificar com `\di` no psql)

## 🔄 Rollback (se necessário)

```bash
# Restaurar schema antigo
cp prisma/schema-OLD.prisma.bak prisma/schema.prisma

# Resetar database
npx prisma migrate reset --force

# Regenerar cliente
npx prisma generate
```

## 📚 Próximos Passos

Se os testes passarem, siga para:

1. **Atualizar entidades de domínio** (src/entity/)
2. **Refatorar repositories** (usar Prisma Client)
3. **Atualizar use cases** (BloodstockService)
4. **Criar testes E2E** com novo schema
5. **Migração de produção** (seguir docs/MIGRATION_GUIDE.md)

## 💡 Dicas

- **Performance**: StockView deve ter dados sempre atualizados (job agendado)
- **FIFO**: Sempre usar `orderBy: { expiresAt: 'asc' }`
- **Auditoria**: Movement registra TUDO (obrigatório)
- **Validação**: Sempre verificar `expiresAt >= new Date()` antes de usar bolsa
- **Atomicidade**: Usar `$transaction` em operações compostas

## 🆘 Troubleshooting

### Erro: "P2002: Unique constraint failed"
- Verifique se já existe registro com mesmo CNPJ/email/bagCode

### StockView desatualizado
- Execute `recalculateStockView(companyId)`

### Bolsas não aparecem no FIFO
- Verifique status (`AVAILABLE`) e validade (`expiresAt >= NOW()`)

---

**Documentação Completa**:
- [COMPLETE_SCHEMA_ANALYSIS.md](../COMPLETE_SCHEMA_ANALYSIS.md) - Análise detalhada
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Guia de migração
- [queries-refactored.ts](../../src/examples/queries-refactored.ts) - 20+ queries prontas
