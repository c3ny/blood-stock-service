# 🏥 Análise Completa e Refatoramento do Schema - Blood Stock Service

## 📋 Sumário Executivo

**Status Atual**: ❌ **SCHEMA COM PROBLEMAS CRÍTICOS DE DESIGN**

O schema atual apresenta múltiplos problemas que impedem rastreabilidade adequada, controle de estoque por bolsa individual, e auditoria completa de movimentações. É necessária uma **refatoração completa** para atender aos requisitos de um sistema de hemocentro profissional.

---

## 🔍 PARTE 1: Análise Detalhada do Schema Atual

### 1.1 Problemas Críticos Identificados

#### ❌ **Problema #1: Redundância em Stock**
```prisma
model Stock {
  bloodType   BloodType  // ← Define UM tipo: A_POS
  quantityA   Int        // ← Mas tem 4 campos para tipos!
  quantityB   Int
  quantityAB  Int
  quantityO   Int
}
```

**Impacto**:
- Impossível diferenciar A+ de A- (ambos estariam em `quantityA`)
- Ambiguidade total sobre qual tipo sanguíneo cada campo representa
- Violação de normalização (dados redundantes)
- Queries impossíveis para tipo específico

#### ❌ **Problema #2: Falta de Modelo para Bolsas Individuais**

**Situação Atual**:
- `Batch` registra `entryQuantity` e `exitQuantity` (agregados)
- **Não há rastreamento individual de cada bolsa de sangue!**

**Consequências**:
- Impossível rastrear validade por bolsa
- Impossível implementar FIFO (First In, First Out)
- Impossível saber qual bolsa específica foi usada
- Impossível auditoria granular
- Não atende regulamentações de hemocentros

**Exemplo Real**:
```typescript
// Lote recebe 10 bolsas de A+ em 01/01/2026
// Validades: 5 bolsas vencem em 01/02/2026, 5 em 15/02/2026
// 
// Modelo atual: Apenas sabe que tem 10 unidades
// ❌ Não sabe quais vencem primeiro
// ❌ Não pode implementar FIFO
// ❌ Não pode alertar sobre vencimento específico
```

#### ❌ **Problema #3: Falta de Modelo para Company/Hemocentro**

**Situação Atual**:
- `Stock` e `Batch` têm `companyId` (String)
- **Não há tabela `Company`**

**Consequências**:
- Não pode armazenar nome, CNPJ, endereço do hemocentro
- Não pode validar se `companyId` existe
- Foreign key não garante integridade referencial
- Impossível queries relacionando dados da empresa

#### ❌ **Problema #4: StockMovement Incompleto**

```prisma
model StockMovement {
  movement       Int     // ← O que isso significa? +5 ou -5?
  quantityBefore Int
  quantityAfter  Int
  actionBy       String  // ← Quem? ID? Nome? Email?
  notes          String  // ← Obrigatório mas poderia ser opcional
}
```

**Problemas**:
- `movement Int` - ambíguo (deveria ser enum IN/OUT)
- Não registra **tipo de movimento** (doação/transfusão/descarte/transferência)
- `actionBy` deveria referenciar usuário (FK)
- Não registra **origem** (de onde veio o sangue)
- Não registra **destino** (para onde foi o sangue)
- Sem rastreabilidade de **paciente/doador**

#### ❌ **Problema #5: Batch sem Relação com Stock**

```prisma
model Batch {
  // Não tem relação com Stock! ❌
  entryQuantity Int
  exitQuantity  Int
}

model Stock {
  // Não tem relação com Batch! ❌
  quantityA Int
  // ...
}
```

**Consequência**: 
- Batch e Stock são entidades desconectadas
- Não há sincronia entre lote recebido e estoque atualizado
- Possibilidade de inconsistência de dados

#### ❌ **Problema #6: Falta de Controle de Validade**

**Situação Atual**:
- `Batch` não tem data de validade
- `Stock` não tem data de validade
- **Não há rastreamento de bolsas vencidas!**

**Consequências**:
- Risco de usar sangue vencido
- Não atende normas sanitárias (ANVISA)
- Impossível alertar sobre vencimentos próximos
- Impossível relatório de perdas por vencimento

#### ❌ **Problema #7: Falta de Rastreabilidade de Origem/Destino**

**Situação Atual**:
- Não registra **de onde veio** o lote (doador, campanha, transferência)
- Não registra **para onde foi** a saída (paciente, transferência, descarte)

**Consequências**:
- Impossível rastrear cadeia de custódia
- Não atende requisitos de auditoria
- Impossível investigar em caso de problemas

#### ❌ **Problema #8: Índices Insuficientes**

```prisma
model Stock {
  @@index([companyId, bloodType])  // ← Bom
  @@index([createdAt])             // ← Provavelmente desnecessário
  // Falta: @@unique([companyId, bloodType]) ❌
}

model Batch {
  @@unique([companyId, code])  // ← Bom
  @@index([companyId])
  @@index([bloodType])
  // Falta: index em data de validade ❌
}

model StockMovement {
  // Falta: index em actionBy (para buscar por usuário) ❌
  // Falta: index em tipo de movimento ❌
}
```

---

### 1.2 Resumo dos Problemas

| Problema | Severidade | Impacto |
|----------|-----------|---------|
| Redundância Stock (quantityA/B/AB/O) | 🔴 Crítico | Queries impossíveis, ambiguidade |
| Falta de modelo de Bolsas | 🔴 Crítico | Sem rastreabilidade individual |
| Falta de modelo Company | 🟡 Alto | Sem integridade referencial |
| StockMovement incompleto | 🟡 Alto | Auditoria inadequada |
| Batch desconectado de Stock | 🟡 Alto | Risco de inconsistência |
| Sem controle de validade | 🔴 Crítico | Risco sanitário |
| Sem origem/destino | 🟡 Alto | Auditoria insuficiente |
| Índices insuficientes | 🟢 Médio | Performance ruim em queries |

---

## 🛠️ PARTE 2: Schema Refatorado e Normalizado

### 2.1 Princípios de Design

1. **Normalização Completa**: Cada entidade representa um conceito único
2. **Rastreabilidade Total**: Cada bolsa, lote e movimento rastreável
3. **Integridade Referencial**: Foreign keys garantem consistência
4. **Auditoria Completa**: Quem, quando, o quê, de onde, para onde
5. **Extensibilidade**: Fácil adicionar novos tipos, status, movimentos
6. **Performance**: Índices estratégicos para queries comuns

### 2.2 Modelo Conceitual

```
Company (Hemocentro)
  ↓ 1:N
Batch (Lote recebido)
  ↓ 1:N
BloodBag (Bolsa individual)
  ↓ N:M (através de Movement)
Movement (Movimentação)
  ↓ N:1
User (Responsável)

Stock (Visão agregada)
  → Calculado dinamicamente ou materializado
```

### 2.3 Schema Prisma Completo Refatorado

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum BloodType {
  A_POS    @map("A+")
  A_NEG    @map("A-")
  B_POS    @map("B+")
  B_NEG    @map("B-")
  AB_POS   @map("AB+")
  AB_NEG   @map("AB-")
  O_POS    @map("O+")
  O_NEG    @map("O-")
}

enum BloodBagStatus {
  AVAILABLE      // Disponível para uso
  RESERVED       // Reservado para paciente
  USED           // Utilizado (transfusão)
  EXPIRED        // Vencido
  DISCARDED      // Descartado (qualidade)
  TRANSFERRED    // Transferido para outro hemocentro
}

enum MovementType {
  ENTRY_DONATION     // Entrada: Doação
  ENTRY_TRANSFER_IN  // Entrada: Transferência recebida
  EXIT_TRANSFUSION   // Saída: Transfusão em paciente
  EXIT_TRANSFER_OUT  // Saída: Transferência para outro local
  EXIT_DISCARD       // Saída: Descarte (vencimento/qualidade)
  EXIT_EXPIRED       // Saída: Vencimento
  ADJUSTMENT         // Ajuste de estoque (correção)
}

enum UserRole {
  ADMIN
  TECHNICIAN
  DOCTOR
  NURSE
}

// ============================================================
// CORE ENTITIES
// ============================================================

/// Representa um hemocentro/empresa
model Company {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  cnpj      String   @unique
  address   String?
  phone     String?
  email     String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  batches    Batch[]
  users      User[]
  stockViews StockView[]
  movements  Movement[]

  @@index([cnpj])
  @@index([isActive])
  @@map("company")
}

/// Representa um usuário do sistema (técnico, médico, etc.)
model User {
  id        String   @id @default(uuid()) @db.Uuid
  companyId String   @db.Uuid @map("company_id")
  name      String
  email     String   @unique
  role      UserRole
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  company   Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  movements Movement[]

  @@index([companyId])
  @@index([email])
  @@index([role])
  @@map("user")
}

/// Representa um lote de sangue recebido
model Batch {
  id             String    @id @default(uuid()) @db.Uuid
  companyId      String    @db.Uuid @map("company_id")
  code           String    // Código do lote (ex: LOTE-2026-001)
  bloodType      BloodType @map("blood_type")
  receivedAt     DateTime  @map("received_at") // Data de recebimento
  expiresAt      DateTime  @map("expires_at")  // Data de validade do lote
  donorReference String?   @map("donor_reference") // Referência do doador/campanha
  notes          String?   // Observações gerais do lote
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  company   Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  bloodBags BloodBag[]

  // Constraint: Código único por empresa
  @@unique([companyId, code])
  @@index([companyId])
  @@index([bloodType])
  @@index([expiresAt]) // Importante para alertas de vencimento
  @@index([receivedAt])
  @@map("batch")
}

/// Representa uma bolsa individual de sangue
model BloodBag {
  id              String         @id @default(uuid()) @db.Uuid
  batchId         String         @db.Uuid @map("batch_id")
  bagCode         String         @unique @map("bag_code") // Código único da bolsa (ex: BAG-2026-001-A)
  bloodType       BloodType      @map("blood_type") // Redundante com Batch, mas facilita queries
  volume          Int            // Volume em mL (tipicamente 450mL ou 500mL)
  status          BloodBagStatus @default(AVAILABLE)
  expiresAt       DateTime       @map("expires_at") // Data de validade específica da bolsa
  reservedFor     String?        @map("reserved_for") // ID do paciente se reservado
  reservedAt      DateTime?      @map("reserved_at")
  usedAt          DateTime?      @map("used_at")
  discardedAt     DateTime?      @map("discarded_at")
  discardReason   String?        @map("discard_reason")
  notes           String?
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  batch     Batch      @relation(fields: [batchId], references: [id], onDelete: Cascade)
  movements Movement[]

  @@index([batchId])
  @@index([bloodType])
  @@index([status])
  @@index([expiresAt]) // Crítico para FIFO e alertas
  @@index([reservedFor])
  @@map("blood_bag")
}

/// Representa uma movimentação de estoque (entrada/saída)
model Movement {
  id           String       @id @default(uuid()) @db.Uuid
  companyId    String       @db.Uuid @map("company_id")
  bloodBagId   String?      @db.Uuid @map("blood_bag_id") // Null para ajustes bulk
  userId       String       @db.Uuid @map("user_id")
  type         MovementType
  bloodType    BloodType    @map("blood_type") // Denormalizado para facilitar queries
  quantity     Int          @default(1) // Normalmente 1 bolsa, mas pode ser ajuste bulk
  origin       String?      // Origem (doador ID, hemocentro origem, etc.)
  destination  String?      // Destino (paciente ID, hemocentro destino, etc.)
  notes        String?
  createdAt    DateTime     @default(now()) @map("created_at")

  company  Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  bloodBag BloodBag? @relation(fields: [bloodBagId], references: [id], onDelete: SetNull)
  user     User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([companyId])
  @@index([bloodBagId])
  @@index([userId])
  @@index([type])
  @@index([bloodType])
  @@index([createdAt])
  @@index([companyId, bloodType, createdAt]) // Composite para relatórios
  @@map("movement")
}

/// Visão materializada ou calculada de estoque por tipo sanguíneo
/// (Pode ser materializada view ou tabela sincronizada via trigger)
model StockView {
  id               String    @id @default(uuid()) @db.Uuid
  companyId        String    @db.Uuid @map("company_id")
  bloodType        BloodType @map("blood_type")
  availableCount   Int       @default(0) @map("available_count")   // Bolsas disponíveis
  reservedCount    Int       @default(0) @map("reserved_count")    // Bolsas reservadas
  expiringSoonCount Int      @default(0) @map("expiring_soon_count") // Vencendo em < 7 dias
  totalVolume      Int       @default(0) @map("total_volume")      // Volume total em mL
  lastUpdated      DateTime  @default(now()) @map("last_updated")

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Constraint: 1 registro por empresa + tipo sanguíneo
  @@unique([companyId, bloodType])
  @@index([companyId])
  @@index([bloodType])
  @@index([availableCount]) // Para alertas de estoque baixo
  @@map("stock_view")
}

// ============================================================
// TABELAS AUXILIARES (FUTURO)
// ============================================================

/// Alertas de estoque baixo ou vencimento próximo (futuro)
model StockAlert {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @db.Uuid @map("company_id")
  bloodType   BloodType @map("blood_type")
  alertType   String   // "LOW_STOCK" | "EXPIRING_SOON" | "EXPIRED"
  message     String
  isResolved  Boolean  @default(false) @map("is_resolved")
  resolvedAt  DateTime? @map("resolved_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([companyId])
  @@index([isResolved])
  @@index([createdAt])
  @@map("stock_alert")
}
```

---

## 📊 PARTE 3: Comparação Antes vs Depois

| Aspecto | Schema Atual | Schema Refatorado |
|---------|--------------|-------------------|
| **Rastreabilidade** | ❌ Apenas agregados | ✅ Bolsa individual |
| **Validade** | ❌ Não controlado | ✅ Por bolsa + alertas |
| **Company** | ❌ Apenas ID (sem tabela) | ✅ Entidade completa |
| **Usuários** | ❌ String genérico | ✅ FK para User |
| **Tipo Movimento** | ❌ Int ambíguo | ✅ Enum detalhado |
| **Origem/Destino** | ❌ Não existe | ✅ Campos específicos |
| **FIFO** | ❌ Impossível | ✅ Possível via expiresAt |
| **Auditoria** | ❌ Parcial | ✅ Completa |
| **Status Bolsa** | ❌ Não existe | ✅ Enum com 6 estados |
| **Stock** | ❌ 4 campos redundantes | ✅ View materializada |
| **Integridade** | ❌ Fraca | ✅ FKs + constraints |
| **Normalização** | ❌ Violada | ✅ 3NF |

---

## 🔄 PARTE 4: Queries Prisma - Exemplos Práticos

### 4.1 Registrar Entrada de Lote

```typescript
import { PrismaClient, BloodType, MovementType } from '@prisma/client';

async function registerBatchEntry(prisma: PrismaClient) {
  const userId = 'user-uuid';
  const companyId = 'company-uuid';
  
  // Transação atômica para garantir consistência
  const result = await prisma.$transaction(async (tx) => {
    // 1. Criar lote
    const batch = await tx.batch.create({
      data: {
        companyId,
        code: 'LOTE-2026-002',
        bloodType: BloodType.A_POS,
        receivedAt: new Date(),
        expiresAt: new Date('2026-03-28'), // 1 mês de validade
        donorReference: 'CAMPANHA-DOACAO-FEV-2026',
        notes: 'Lote recebido de campanha de doação no shopping',
      },
    });

    // 2. Criar bolsas individuais (ex: 10 bolsas)
    const bloodBags = await Promise.all(
      Array.from({ length: 10 }, (_, i) => 
        tx.bloodBag.create({
          data: {
            batchId: batch.id,
            bagCode: `BAG-2026-002-${String.fromCharCode(65 + i)}`, // A, B, C...
            bloodType: BloodType.A_POS,
            volume: 450, // 450mL
            expiresAt: new Date('2026-03-28'),
            status: 'AVAILABLE',
          },
        })
      )
    );

    // 3. Registrar movimento de entrada para cada bolsa
    const movements = await Promise.all(
      bloodBags.map(bag =>
        tx.movement.create({
          data: {
            companyId,
            bloodBagId: bag.id,
            userId,
            type: MovementType.ENTRY_DONATION,
            bloodType: BloodType.A_POS,
            quantity: 1,
            origin: 'CAMPANHA-DOACAO-FEV-2026',
            notes: `Entrada de bolsa ${bag.bagCode}`,
          },
        })
      )
    );

    // 4. Atualizar StockView (view materializada)
    const stockView = await tx.stockView.upsert({
      where: {
        companyId_bloodType: {
          companyId,
          bloodType: BloodType.A_POS,
        },
      },
      create: {
        companyId,
        bloodType: BloodType.A_POS,
        availableCount: 10,
        reservedCount: 0,
        totalVolume: 4500, // 10 * 450mL
        expiringSoonCount: 0,
      },
      update: {
        availableCount: { increment: 10 },
        totalVolume: { increment: 4500 },
        lastUpdated: new Date(),
      },
    });

    return { batch, bloodBags, movements, stockView };
  });

  return result;
}
```

### 4.2 Registrar Saída para Transfusão (FIFO)

```typescript
async function registerTransfusion(
  prisma: PrismaClient,
  companyId: string,
  bloodType: BloodType,
  patientId: string,
  userId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar bolsa DISPONÍVEL mais antiga (FIFO)
    const bloodBag = await tx.bloodBag.findFirst({
      where: {
        batch: { companyId },
        bloodType,
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() }, // Não vencida
      },
      orderBy: {
        expiresAt: 'asc', // FIFO: mais antiga primeiro
      },
    });

    if (!bloodBag) {
      throw new Error(`No available blood bag for type ${bloodType}`);
    }

    // 2. Atualizar status da bolsa
    const updatedBag = await tx.bloodBag.update({
      where: { id: bloodBag.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        reservedFor: null,
      },
    });

    // 3. Registrar movimento de saída
    const movement = await tx.movement.create({
      data: {
        companyId,
        bloodBagId: bloodBag.id,
        userId,
        type: MovementType.EXIT_TRANSFUSION,
        bloodType,
        quantity: 1,
        destination: patientId,
        notes: `Transfusão para paciente ${patientId}`,
      },
    });

    // 4. Atualizar StockView
    await tx.stockView.update({
      where: {
        companyId_bloodType: { companyId, bloodType },
      },
      data: {
        availableCount: { decrement: 1 },
        totalVolume: { decrement: bloodBag.volume },
        lastUpdated: new Date(),
      },
    });

    return { bloodBag: updatedBag, movement };
  });
}
```

### 4.3 Buscar Estoque por Tipo Sanguíneo

```typescript
async function getStockByBloodType(
  prisma: PrismaClient,
  companyId: string,
  bloodType: BloodType
) {
  // Opção 1: Via StockView (rápido)
  const stockSummary = await prisma.stockView.findUnique({
    where: {
      companyId_bloodType: { companyId, bloodType },
    },
  });

  // Opção 2: Calcular em tempo real (preciso mas mais lento)
  const [available, reserved, expiringSoon] = await Promise.all([
    prisma.bloodBag.count({
      where: {
        batch: { companyId },
        bloodType,
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() },
      },
    }),
    prisma.bloodBag.count({
      where: {
        batch: { companyId },
        bloodType,
        status: 'RESERVED',
      },
    }),
    prisma.bloodBag.count({
      where: {
        batch: { companyId },
        bloodType,
        status: 'AVAILABLE',
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      },
    }),
  ]);

  return {
    bloodType,
    available,
    reserved,
    expiringSoon,
    total: available + reserved,
  };
}
```

### 4.4 Listar Bolsas Vencendo Próximo (Alertas)

```typescript
async function getExpiringSoon(
  prisma: PrismaClient,
  companyId: string,
  daysAhead: number = 7
) {
  const expirationDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  return await prisma.bloodBag.findMany({
    where: {
      batch: { companyId },
      status: 'AVAILABLE',
      expiresAt: {
        gte: new Date(),
        lte: expirationDate,
      },
    },
    include: {
      batch: {
        select: {
          code: true,
          bloodType: true,
        },
      },
    },
    orderBy: {
      expiresAt: 'asc', // Mais urgentes primeiro
    },
  });
}
```

### 4.5 Histórico de Movimentações de uma Bolsa

```typescript
async function getBloodBagHistory(
  prisma: PrismaClient,
  bloodBagId: string
) {
  return await prisma.movement.findMany({
    where: { bloodBagId },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
```

### 4.6 Relatório de Movimentações por Período

```typescript
async function getMovementReport(
  prisma: PrismaClient,
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const movements = await prisma.movement.groupBy({
    by: ['type', 'bloodType'],
    where: {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      quantity: true,
    },
    _count: {
      id: true,
    },
  });

  return movements.map(m => ({
    type: m.type,
    bloodType: m.bloodType,
    totalQuantity: m._sum.quantity || 0,
    totalMovements: m._count.id,
  }));
}
```

### 4.7 Reservar Bolsa para Paciente

```typescript
async function reserveBloodBag(
  prisma: PrismaClient,
  companyId: string,
  bloodType: BloodType,
  patientId: string,
  userId: string
) {
  return await prisma.$transaction(async (tx) => {
    // Buscar bolsa disponível (FIFO)
    const bloodBag = await tx.bloodBag.findFirst({
      where: {
        batch: { companyId },
        bloodType,
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    if (!bloodBag) {
      throw new Error('No blood bag available');
    }

    // Atualizar status
    const updated = await tx.bloodBag.update({
      where: { id: bloodBag.id },
      data: {
        status: 'RESERVED',
        reservedFor: patientId,
        reservedAt: new Date(),
      },
    });

    // Atualizar StockView
    await tx.stockView.update({
      where: {
        companyId_bloodType: { companyId, bloodType },
      },
      data: {
        availableCount: { decrement: 1 },
        reservedCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    // Registrar movimento de reserva (opcional)
    await tx.movement.create({
      data: {
        companyId,
        bloodBagId: bloodBag.id,
        userId,
        type: MovementType.ADJUSTMENT,
        bloodType,
        quantity: 0, // Não altera quantidade total
        destination: patientId,
        notes: `Bolsa reservada para paciente ${patientId}`,
      },
    });

    return updated;
  });
}
```

---

## 🔄 PARTE 5: Estratégia de Migração de Dados

### 5.1 Desafio de Migração

**Problema**: Como migrar de um modelo com `quantityA/B/AB/O` (agregado) para bolsas individuais?

#### Opções de Migração

**Opção 1: Reset Completo (Recomendado se sistema novo)** ✅

```sql
-- Dropar schema antigo e começar do zero
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS bloodstock_movement CASCADE;
DROP TABLE IF EXISTS batch CASCADE;

-- Aplicar novo schema via Prisma
-- npx prisma migrate deploy
```

**Vantagens**:
- Início limpo sem ambiguidades
- Modelo correto desde o início
- Sem dados inconsistentes

**Desvantagens**:
- Perde histórico (se houver)

---

**Opção 2: Migração Incremental com Interpretação de Dados** ⚠️

Se há dados históricos importantes:

```typescript
async function migrateOldBatchToNewModel(prisma: PrismaClient) {
  // Buscar lotes antigos
  const oldBatches = await prisma.$queryRaw`
    SELECT * FROM batch_old
  `;

  for (const oldBatch of oldBatches) {
    await prisma.$transaction(async (tx) => {
      // 1. Criar novo lote
      const newBatch = await tx.batch.create({
        data: {
          companyId: oldBatch.company_id,
          code: oldBatch.code,
          bloodType: oldBatch.blood_type,
          receivedAt: oldBatch.created_at,
          expiresAt: new Date(oldBatch.created_at.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 dias assumido
          notes: 'Migrado de sistema antigo',
        },
      });

      // 2. Interpretar entryQuantity como bolsas individuais
      // DECISÃO: assumir que entryQuantity = número de bolsas
      const bagCount = oldBatch.entry_quantity;

      for (let i = 0; i < bagCount; i++) {
        await tx.bloodBag.create({
          data: {
            batchId: newBatch.id,
            bagCode: `MIGRATED-${oldBatch.code}-${i + 1}`,
            bloodType: oldBatch.blood_type,
            volume: 450, // Assumir 450mL padrão
            status: i < oldBatch.exit_quantity ? 'USED' : 'AVAILABLE',
            expiresAt: newBatch.expiresAt,
            notes: 'Migrado de sistema antigo',
          },
        });
      }
    });
  }
}
```

**Vantagens**:
- Mantém histórico de lotes
- Cria estrutura individual de bolsas

**Desvantagens**:
- Interpretação heurística (pode estar errada)
- Não tem dados reais de cada bolsa

---

**Opção 3: Dual-Write durante Transição** 🔄

```typescript
// Fase 1: Escrever em ambos schemas (antigo e novo)
async function registerEntryDualWrite(data) {
  await Promise.all([
    registerEntryOldModel(data),  // Sistema antigo
    registerEntryNewModel(data),  // Sistema novo
  ]);
}

// Fase 2: Validar consistência por 2 semanas
// Fase 3: Migrar apenas para novo modelo
// Fase 4: Dropar schema antigo
```

---

### 5.2 Plano de Migração Recomendado

#### Fase 1: Preparação (1 semana)
- [ ] Criar novo schema em ambiente de desenvolvimento
- [ ] Implementar queries e use cases com novo modelo
- [ ] Testes unitários e E2E com novo schema
- [ ] Documentar diferenças para equipe

#### Fase 2: Deploy Paralelo (2 semanas)
- [ ] Deploy novo schema em staging
- [ ] Dual-write: escrever em ambos modelos
- [ ] Monitorar inconsistências
- [ ] Ajustar lógica conforme necessário

#### Fase 3: Migração de Dados (1 dia)
- [ ] Backup completo do banco de produção
- [ ] Executar script de migração em produção
- [ ] Validar integridade dos dados migrados
- [ ] Rollback plan pronto se necessário

#### Fase 4: Cutover (1 dia)
- [ ] Desativar escritas no modelo antigo
- [ ] Ativar apenas modelo novo
- [ ] Monitorar erros
- [ ] Validar funcionalidades críticas

#### Fase 5: Cleanup (1 semana)
- [ ] Dropar tabelas antigas após 1 semana sem incidentes
- [ ] Atualizar documentação
- [ ] Treinamento da equipe

---

## 🚀 PARTE 6: Refatoramento do Código da Aplicação

### 6.1 Before: Código Atual (Problemático)

```typescript
// ❌ Código atual com problemas

// StockItem entity - modelo antigo
class StockItem {
  private quantityA: Quantity;
  private quantityB: Quantity;
  private quantityAB: Quantity;
  private quantityO: Quantity;
  
  // Lógica confusa para ajustar
  adjustBy(movement: number): void {
    const quantity = this.getQuantityByBloodType(this.bloodType);
    // ↑ Não faz sentido: bloodType define 1 tipo (A+)
    //   mas quantityA poderia ser A+ e A- misturados
  }
}

// Repository - queries problemáticas
async findStockByBloodType(companyId: string, bloodType: string) {
  const stock = await prisma.stock.findFirst({
    where: { companyId, bloodType: bloodType as BloodType }
  });
  // ↑ Retorna 1 Stock com 4 campos de quantidade
  //   Não consegue diferenciar A+ de A-
  return stock;
}
```

### 6.2 After: Código Refatorado

```typescript
// ✅ Código refatorado com novo schema

// BloodBag entity - modelo correto
class BloodBagEntity {
  constructor(
    private id: string,
    private batchId: string,
    private bagCode: string,
    private bloodType: BloodType,
    private volume: number,
    private status: BloodBagStatus,
    private expiresAt: Date
  ) {}

  canBeUsed(): boolean {
    return (
      this.status === BloodBagStatus.AVAILABLE &&
      this.expiresAt > new Date()
    );
  }

  reserve(patientId: string): void {
    if (!this.canBeUsed()) {
      throw new Error('Blood bag cannot be reserved');
    }
    this.status = BloodBagStatus.RESERVED;
  }

  use(): void {
    if (this.status !== BloodBagStatus.RESERVED && this.status !== BloodBagStatus.AVAILABLE) {
      throw new Error('Blood bag cannot be used');
    }
    this.status = BloodBagStatus.USED;
  }
}

// Repository - queries claras
class BloodBagRepository {
  async findAvailableByBloodType(
    companyId: string,
    bloodType: BloodType
  ): Promise<BloodBagEntity[]> {
    const bags = await this.prisma.bloodBag.findMany({
      where: {
        batch: { companyId },
        bloodType,
        status: BloodBagStatus.AVAILABLE,
        expiresAt: { gte: new Date() },
      },
      orderBy: {
        expiresAt: 'asc', // FIFO
      },
    });

    return bags.map(bag => this.toDomain(bag));
  }

  async findNextAvailable(
    companyId: string,
    bloodType: BloodType
  ): Promise<BloodBagEntity | null> {
    const bag = await this.prisma.bloodBag.findFirst({
      where: {
        batch: { companyId },
        bloodType,
        status: BloodBagStatus.AVAILABLE,
        expiresAt: { gte: new Date() },
      },
      orderBy: {
        expiresAt: 'asc', // FIFO: bolsa mais antiga
      },
    });

    return bag ? this.toDomain(bag) : null;
  }
}

// Use Case - registro de transfusão
class RegisterTransfusionUseCase {
  async execute(command: RegisterTransfusionCommand) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Buscar bolsa disponível (FIFO)
      const bloodBag = await this.bloodBagRepo.findNextAvailable(
        command.companyId,
        command.bloodType
      );

      if (!bloodBag) {
        throw new NoBloodBagAvailableError(command.bloodType);
      }

      // 2. Usar bolsa
      bloodBag.use();
      await this.bloodBagRepo.save(bloodBag);

      // 3. Registrar movimento
      const movement = Movement.create({
        companyId: command.companyId,
        bloodBagId: bloodBag.getId(),
        userId: command.userId,
        type: MovementType.EXIT_TRANSFUSION,
        bloodType: command.bloodType,
        destination: command.patientId,
        notes: command.notes,
      });
      await this.movementRepo.save(movement);

      // 4. Atualizar stock view
      await this.stockViewService.decrementAvailable(
        command.companyId,
        command.bloodType
      );

      return { bloodBag, movement };
    });
  }
}
```

### 6.3 Mudanças Principais no Código

| Componente | Antes | Depois |
|-----------|-------|--------|
| **Entity** | `StockItem` com 4 quantidades | `BloodBag` individual |
| **Repository** | Query retorna aggregate | Query retorna bolsas específicas |
| **Use Case** | Ajusta campo quantity* | Muda status da bolsa |
| **Lógica FIFO** | ❌ Impossível | ✅ `orderBy: expiresAt` |
| **Validação** | Apenas quantity >= 0 | Status + validade + disponibilidade |
| **Auditoria** | Movimento com Int genérico | Movimento com enum + origem/destino |

---

## 🌟 PARTE 7: Considerações Futuras e Extensibilidade

### 7.1 Novos Tipos de Sangue

**Cenário**: Adicionar novo tipo raro (ex: `Bombay Phenotype`)

**Com Schema Refatorado**: ✅ Simples

```prisma
// 1. Adicionar no enum
enum BloodType {
  // ... tipos existentes
  BOMBAY_POS  @map("Bombay+")
  BOMBAY_NEG  @map("Bombay-")
}

// 2. Nenhuma migration necessária em tabelas!
// 3. Novos registros criados naturalmente
```

**Com Schema Antigo**: ❌ Complexo

```prisma
// Precisaria adicionar novo campo quantityBombay!
model Stock {
  quantityA
  quantityB
  quantityAB
  quantityO
  quantityBombay  // ← Migration em TODOS os registros existentes
}
```

---

### 7.2 Múltiplos Hemocentros e Transferências

**Já Suportado no Schema Refatorado**: ✅

```typescript
// Transferir bolsa entre hemocentros
async function transferBloodBag(
  bloodBagId: string,
  fromCompanyId: string,
  toCompanyId: string,
  userId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Registrar saída no hemocentro origem
    await tx.movement.create({
      data: {
        companyId: fromCompanyId,
        bloodBagId,
        userId,
        type: MovementType.EXIT_TRANSFER_OUT,
        bloodType: bloodBag.bloodType,
        destination: toCompanyId,
        notes: `Transferência para ${toCompanyName}`,
      },
    });

    // 2. Atualizar companyId da bolsa (se permitido)
    // Ou criar nova bolsa no destino

    // 3. Registrar entrada no hemocentro destino
    await tx.movement.create({
      data: {
        companyId: toCompanyId,
        bloodBagId,
        userId,
        type: MovementType.ENTRY_TRANSFER_IN,
        bloodType: bloodBag.bloodType,
        origin: fromCompanyId,
        notes: `Recebido de ${fromCompanyName}`,
      },
    });

    // 4. Atualizar StockView em ambos
    // ...
  });
}
```

---

### 7.3 Novos Tipos de Movimentação

**Fácil Extensão**:

```prisma
enum MovementType {
  // Existentes...
  
  // Novos (futuro)
  ENTRY_PURCHASE            // Compra de outro hemocentro
  EXIT_RESEARCH             // Saída para pesquisa científica
  EXIT_QUALITY_CONTROL      // Saída para controle de qualidade
  INTERNAL_LOCATION_CHANGE  // Mudança de localização interna
}
```

Sem migration necessária em dados existentes!

---

### 7.4 Performance com Grande Volume de Dados

#### Índices Estratégicos (Já Incluídos)

```prisma
model BloodBag {
  @@index([expiresAt])        // FIFO + alertas
  @@index([status])           // Filtros por status
  @@index([bloodType])        // Filtros por tipo
  @@index([batchId])          // Joins com Batch
}

model Movement {
  @@index([companyId, bloodType, createdAt])  // Relatórios
}
```

#### StockView Materializada

```sql
-- View materializada atualizada via trigger ou job
CREATE MATERIALIZED VIEW stock_summary AS
SELECT 
  company_id,
  blood_type,
  COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_count,
  COUNT(*) FILTER (WHERE status = 'RESERVED') AS reserved_count,
  SUM(volume) FILTER (WHERE status IN ('AVAILABLE', 'RESERVED')) AS total_volume
FROM blood_bag
GROUP BY company_id, blood_type;

-- Atualizar a cada N minutos
REFRESH MATERIALIZED VIEW stock_summary;
```

#### Particionamento (Para > 1M registros)

```sql
-- Particionar Movement por data (mensal)
CREATE TABLE movement_2026_01 PARTITION OF movement
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE movement_2026_02 PARTITION OF movement
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

### 7.5 Auditoria Avançada

**Event Sourcing (Futuro)**:

```prisma
model EventStore {
  id            String   @id @default(uuid())
  aggregateId   String   // bloodBagId ou movementId
  aggregateType String   // "BloodBag" | "Movement"
  eventType     String   // "BagCreated" | "BagReserved" | "BagUsed"
  eventData     Json     // Snapshot completo do evento
  userId        String
  timestamp     DateTime @default(now())

  @@index([aggregateId])
  @@index([aggregateType])
  @@index([timestamp])
}
```

Permite reconstruir histórico completo de qualquer bolsa.

---

### 7.6 Integração com Sistemas Externos

**Preparado para**:
- **ANVISA**: Relatórios de rastreabilidade
- **SUS**: Exportação de dados de transfusões
- **Laboratórios**: Integração de resultados de testes
- **Outros Hemocentros**: API de transferência

```typescript
// Endpoint para exportação ANVISA
async function exportAnvisaReport(companyId: string, month: string) {
  const movements = await prisma.movement.findMany({
    where: {
      companyId,
      createdAt: {
        gte: new Date(`${month}-01`),
        lt: new Date(`${month}-31`),
      },
    },
    include: {
      bloodBag: {
        include: {
          batch: true,
        },
      },
      user: true,
    },
  });

  return formatAnvisaXML(movements);
}
```

---

## 📋 PARTE 8: Checklist de Implementação

### Fase 1: Design e Modelagem ✅
- [x] Análise do schema atual
- [x] Identificação de problemas
- [x] Design do novo schema
- [x] Definição de índices e constraints
- [x] Documentação completa

### Fase 2: Implementação Backend
- [ ] Criar novo schema.prisma
- [ ] Executar `prisma migrate dev`
- [ ] Implementar entidades de domínio
  - [ ] Company
  - [ ] User
  - [ ] Batch
  - [ ] BloodBag
  - [ ] Movement
  - [ ] StockView
- [ ] Implementar repositories
- [ ] Implementar use cases
  - [ ] RegisterBatchEntry
  - [ ] RegisterTransfusion
  - [ ] ReserveBloodBag
  - [ ] TransferBloodBag
  - [ ] DiscardExpiredBags
- [ ] Implementar services auxiliares
  - [ ] StockViewService
  - [ ] AlertService
  - [ ] FIFOService

### Fase 3: Testes
- [ ] Testes unitários de entidades
- [ ] Testes de repositories
- [ ] Testes de use cases
- [ ] Testes E2E de fluxos completos
- [ ] Testes de performance

### Fase 4: Migração
- [ ] Script de migração de dados
- [ ] Testes em staging
- [ ] Validação de integridade
- [ ] Backup e rollback plan

### Fase 5: Deploy
- [ ] Deploy em produção
- [ ] Monitoramento
- [ ] Ajustes pós-deploy
- [ ] Documentação atualizada

---

## 🎯 PARTE 9: Resumo e Próximos Passos

### Problemas Resolvidos ✅

| Problema Antigo | Solução Nova |
|----------------|--------------|
| ❌ Redundância quantidade* vs bloodType | ✅ 1 bolsa = 1 registro com 1 bloodType |
| ❌ Sem rastreabilidade de bolsas | ✅ Tabela BloodBag individual |
| ❌ Sem controle de validade | ✅ expiresAt por bolsa + alertas |
| ❌ Sem FIFO | ✅ orderBy expiresAt ASC |
| ❌ Sem Company model | ✅ Tabela Company completa |
| ❌ Movimento ambíguo (Int) | ✅ Enum MovementType detalhado |
| ❌ Sem origem/destino | ✅ Campos origin/destination |
| ❌ Sem auditoria completa | ✅ Movement + User + timestamps |
| ❌ Stock desconectado de Batch | ✅ StockView calculado de BloodBag |

### Benefícios do Novo Schema ✨

1. **Rastreabilidade Total**: Cada bolsa rastreável do lote até destino final
2. **Conformidade**: Atende ANVISA e normas sanitárias
3. **FIFO Automático**: Sempre usa bolsa mais antiga
4. **Alertas**: Detecta vencimentos e estoque baixo
5. **Auditoria**: Histórico completo de quem fez o quê
6. **Performance**: Índices otimizados para queries comuns
7. **Extensibilidade**: Fácil adicionar novos tipos/status/movimentos
8. **Multi-tenant**: Suporta múltiplos hemocentros
9. **Integridade**: FKs garantem consistência

### Próximo Passo IMEDIATO ⚡

**Recomendação**: Implementar schema refatorado em **ambiente de desenvolvimento**

```bash
# 1. Backup schema atual
cp prisma/schema.prisma prisma/schema.old.prisma

# 2. Substituir com novo schema (vou criar arquivo)
# 3. Criar migration
npx prisma migrate dev --name refactor_blood_stock_complete

# 4. Gerar client
npx prisma generate

# 5. Executar testes
npm run test:e2e
```

---

## 📄 Arquivos a Serem Criados

Vou criar os seguintes arquivos para você:

1. **`prisma/schema-refactored.prisma`** - Schema completo refatorado
2. **`docs/MIGRATION_GUIDE.md`** - Guia detalhado de migração
3. **`src/examples/queries-refactored.ts`** - Exemplos de queries
4. **`docs/SCHEMA_COMPARISON.md`** - Comparação detalhada antes/depois

Quer que eu crie esses arquivos agora? 🚀
