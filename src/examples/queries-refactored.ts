/**
 * BLOOD STOCK SERVICE - Query Examples com Schema Refatorado
 * 
 * Este arquivo contém exemplos práticos de queries Prisma usando
 * o novo schema normalizado com rastreabilidade de bolsas individuais.
 * 
 * Índice:
 * 1. Setup e Inicialização
 * 2. Cadastro de Empresa e Usuários
 * 3. Entrada de Lotes e Bolsas
 * 4. Consultas de Estoque
 * 5. Saídas (Transfusão, Transferência, Descarte)
 * 6. Reservas
 * 7. Alertas e Monitoramento
 * 8. Relatórios e Auditoria
 * 9. Funções Auxiliares
 * 10. Performance e Otimizações
 */

import { PrismaClient, BloodType, BloodBagStatus, MovementType, UserRole, AlertType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// 1. SETUP E INICIALIZAÇÃO
// ============================================================

/**
 * Criar empresa (hemocentro)
 */
async function createCompany() {
  return await prisma.company.create({
    data: {
      name: 'Hemocentro Central de São Paulo',
      cnpj: '00.000.000/0001-00',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 3000-0000',
      email: 'contato@hemocentro-sp.org.br',
      isActive: true,
    },
  });
}

/**
 * Criar usuário técnico
 */
async function createUser(companyId: string) {
  return await prisma.user.create({
    data: {
      companyId,
      name: 'Maria Silva',
      email: 'maria.silva@hemocentro-sp.org.br',
      password: '$2b$10$...', // Hash bcrypt
      role: UserRole.TECHNICIAN,
      cpf: '000.000.000-00',
      phone: '(11) 90000-0000',
      isActive: true,
    },
  });
}

// ============================================================
// 2. ENTRADA DE LOTES E BOLSAS
// ============================================================

/**
 * Registrar entrada de lote com múltiplas bolsas
 * Cenário: Doação de campanha recebeu 10 bolsas de A+
 */
async function registerBatchEntry(
  companyId: string,
  userId: string,
  bloodType: BloodType,
  bagCount: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Criar lote
    const batch = await tx.batch.create({
      data: {
        companyId,
        code: `LOTE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        bloodType,
        receivedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        donorReference: 'CAMPANHA-DOACAO-MAR-2026',
        sourceLocation: 'Shopping Center Plaza',
        notes: 'Lote recebido de campanha de doação',
      },
    });

    // 2. Criar bolsas individuais
    const bloodBags = await Promise.all(
      Array.from({ length: bagCount }, async (_, i) => {
        const bagCode = `BAG-${batch.code}-${String.fromCharCode(65 + i)}`; // A, B, C...
        
        return await tx.bloodBag.create({
          data: {
            batchId: batch.id,
            bagCode,
            bloodType,
            volume: 450, // 450mL padrão
            status: BloodBagStatus.AVAILABLE,
            expiresAt: batch.expiresAt,
            notes: `Bolsa ${i + 1}/${bagCount} do lote ${batch.code}`,
          },
        });
      })
    );

    // 3. Registrar movimentos de entrada para cada bolsa
    const movements = await Promise.all(
      bloodBags.map(bag =>
        tx.movement.create({
          data: {
            companyId,
            bloodBagId: bag.id,
            userId,
            type: MovementType.ENTRY_DONATION,
            bloodType,
            quantity: 1,
            origin: 'CAMPANHA-DOACAO-MAR-2026',
            notes: `Entrada de bolsa ${bag.bagCode}`,
          },
        })
      )
    );

    // 4. Atualizar/criar StockView
    const stockView = await tx.stockView.upsert({
      where: {
        companyId_bloodType: {
          companyId,
          bloodType,
        },
      },
      create: {
        companyId,
        bloodType,
        availableCount: bagCount,
        reservedCount: 0,
        usedCount: 0,
        expiredCount: 0,
        discardedCount: 0,
        expiringSoonCount: 0,
        totalVolume: bagCount * 450,
        availableVolume: bagCount * 450,
        lastUpdated: new Date(),
        oldestExpirationDate: batch.expiresAt,
      },
      update: {
        availableCount: { increment: bagCount },
        totalVolume: { increment: bagCount * 450 },
        availableVolume: { increment: bagCount * 450 },
        lastUpdated: new Date(),
      },
    });

    return { batch, bloodBags, movements, stockView };
  });
}

// ============================================================
// 3. CONSULTAS DE ESTOQUE
// ============================================================

/**
 * Buscar estoque resumido por tipo sanguíneo (via StockView)
 */
async function getStockSummary(companyId: string, bloodType: BloodType) {
  return await prisma.stockView.findUnique({
    where: {
      companyId_bloodType: {
        companyId,
        bloodType,
      },
    },
    include: {
      company: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Buscar estoque completo de todos os tipos sanguíneos
 */
async function getAllStockSummary(companyId: string) {
  return await prisma.stockView.findMany({
    where: { companyId },
    orderBy: {
      bloodType: 'asc',
    },
  });
}

/**
 * Buscar bolsas disponíveis de um tipo específico (FIFO)
 */
async function getAvailableBloodBags(companyId: string, bloodType: BloodType) {
  return await prisma.bloodBag.findMany({
    where: {
      batch: { companyId },
      bloodType,
      status: BloodBagStatus.AVAILABLE,
      expiresAt: { gte: new Date() }, // Não vencidas
    },
    include: {
      batch: {
        select: {
          code: true,
          receivedAt: true,
        },
      },
    },
    orderBy: {
      expiresAt: 'asc', // FIFO: mais antiga primeiro
    },
  });
}

/**
 * Buscar próxima bolsa disponível (FIFO)
 */
async function getNextAvailableBag(companyId: string, bloodType: BloodType) {
  return await prisma.bloodBag.findFirst({
    where: {
      batch: { companyId },
      bloodType,
      status: BloodBagStatus.AVAILABLE,
      expiresAt: { gte: new Date() },
    },
    include: {
      batch: true,
    },
    orderBy: {
      expiresAt: 'asc',
    },
  });
}

/**
 * Buscar bolsas vencendo em breve (próximos N dias)
 */
async function getExpiringSoonBags(companyId: string, daysAhead: number = 7) {
  const expirationDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  return await prisma.bloodBag.findMany({
    where: {
      batch: { companyId },
      status: BloodBagStatus.AVAILABLE,
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
      expiresAt: 'asc',
    },
  });
}

/**
 * Buscar bolsas vencidas não descartadas
 */
async function getExpiredBags(companyId: string) {
  return await prisma.bloodBag.findMany({
    where: {
      batch: { companyId },
      status: {
        in: [BloodBagStatus.AVAILABLE, BloodBagStatus.RESERVED],
      },
      expiresAt: {
        lt: new Date(),
      },
    },
    include: {
      batch: true,
    },
    orderBy: {
      expiresAt: 'asc',
    },
  });
}

// ============================================================
// 4. SAÍDAS (TRANSFUSÃO, TRANSFERÊNCIA, DESCARTE)
// ============================================================

/**
 * Registrar transfusão (saída para paciente)
 * Implementa FIFO automaticamente
 */
async function registerTransfusion(
  companyId: string,
  bloodType: BloodType,
  patientId: string,
  userId: string,
  notes?: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar bolsa disponível (FIFO)
    const bloodBag = await tx.bloodBag.findFirst({
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

    if (!bloodBag) {
      throw new Error(`No available blood bag for type ${bloodType}`);
    }

    // 2. Atualizar status da bolsa
    const updatedBag = await tx.bloodBag.update({
      where: { id: bloodBag.id },
      data: {
        status: BloodBagStatus.USED,
        usedAt: new Date(),
        usedBy: userId,
        usedFor: patientId,
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
        notes: notes || `Transfusão para paciente ${patientId}`,
      },
    });

    // 4. Atualizar StockView
    await tx.stockView.update({
      where: {
        companyId_bloodType: { companyId, bloodType },
      },
      data: {
        availableCount: { decrement: 1 },
        availableVolume: { decrement: bloodBag.volume },
        usedCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    return { bloodBag: updatedBag, movement };
  });
}

/**
 * Transferir bolsa para outro hemocentro
 */
async function transferBloodBag(
  bloodBagId: string,
  fromCompanyId: string,
  toCompanyId: string,
  userId: string,
  notes?: string
) {
  return await prisma.$transaction(async (tx) => {
    const bloodBag = await tx.bloodBag.findUniqueOrThrow({
      where: { id: bloodBagId },
      include: { batch: true },
    });

    if (bloodBag.status !== BloodBagStatus.AVAILABLE) {
      throw new Error('Blood bag is not available for transfer');
    }

    // 1. Atualizar status da bolsa
    const updatedBag = await tx.bloodBag.update({
      where: { id: bloodBagId },
      data: {
        status: BloodBagStatus.TRANSFERRED,
      },
    });

    // 2. Registrar saída no hemocentro origem
    await tx.movement.create({
      data: {
        companyId: fromCompanyId,
        bloodBagId,
        userId,
        type: MovementType.EXIT_TRANSFER_OUT,
        bloodType: bloodBag.bloodType,
        quantity: 1,
        destination: toCompanyId,
        notes: notes || `Transferência para hemocentro ${toCompanyId}`,
      },
    });

    // 3. Registrar entrada no hemocentro destino
    await tx.movement.create({
      data: {
        companyId: toCompanyId,
        bloodBagId,
        userId,
        type: MovementType.ENTRY_TRANSFER_IN,
        bloodType: bloodBag.bloodType,
        quantity: 1,
        origin: fromCompanyId,
        notes: notes || `Recebido de hemocentro ${fromCompanyId}`,
      },
    });

    // 4. Atualizar StockView em origem
    await tx.stockView.update({
      where: {
        companyId_bloodType: {
          companyId: fromCompanyId,
          bloodType: bloodBag.bloodType,
        },
      },
      data: {
        availableCount: { decrement: 1 },
        availableVolume: { decrement: bloodBag.volume },
        lastUpdated: new Date(),
      },
    });

    // 5. Atualizar StockView em destino
    await tx.stockView.upsert({
      where: {
        companyId_bloodType: {
          companyId: toCompanyId,
          bloodType: bloodBag.bloodType,
        },
      },
      create: {
        companyId: toCompanyId,
        bloodType: bloodBag.bloodType,
        availableCount: 1,
        totalVolume: bloodBag.volume,
        availableVolume: bloodBag.volume,
        lastUpdated: new Date(),
      },
      update: {
        availableCount: { increment: 1 },
        totalVolume: { increment: bloodBag.volume },
        availableVolume: { increment: bloodBag.volume },
        lastUpdated: new Date(),
      },
    });

    return updatedBag;
  });
}

/**
 * Descartar bolsa (vencimento ou qualidade)
 */
async function discardBloodBag(
  bloodBagId: string,
  userId: string,
  reason: string,
  movementType: MovementType = MovementType.EXIT_DISCARD
) {
  return await prisma.$transaction(async (tx) => {
    const bloodBag = await tx.bloodBag.findUniqueOrThrow({
      where: { id: bloodBagId },
      include: { batch: true },
    });

    // 1. Atualizar status da bolsa
    const updatedBag = await tx.bloodBag.update({
      where: { id: bloodBagId },
      data: {
        status: BloodBagStatus.DISCARDED,
        discardedAt: new Date(),
        discardedBy: userId,
        discardReason: reason,
      },
    });

    // 2. Registrar movimento de descarte
    const movement = await tx.movement.create({
      data: {
        companyId: bloodBag.batch.companyId,
        bloodBagId,
        userId,
        type: movementType,
        bloodType: bloodBag.bloodType,
        quantity: 1,
        notes: `Descarte: ${reason}`,
      },
    });

    // 3. Atualizar StockView
    await tx.stockView.update({
      where: {
        companyId_bloodType: {
          companyId: bloodBag.batch.companyId,
          bloodType: bloodBag.bloodType,
        },
      },
      data: {
        availableCount: { decrement: bloodBag.status === BloodBagStatus.AVAILABLE ? 1 : 0 },
        reservedCount: { decrement: bloodBag.status === BloodBagStatus.RESERVED ? 1 : 0 },
        discardedCount: { increment: 1 },
        availableVolume: { decrement: bloodBag.status === BloodBagStatus.AVAILABLE ? bloodBag.volume : 0 },
        lastUpdated: new Date(),
      },
    });

    return { bloodBag: updatedBag, movement };
  });
}

/**
 * Descartar automaticamente bolsas vencidas
 */
async function discardExpiredBags(companyId: string, userId: string) {
  const expiredBags = await getExpiredBags(companyId);

  return await Promise.all(
    expiredBags.map(bag =>
      discardBloodBag(
        bag.id,
        userId,
        `Vencimento: ${bag.expiresAt.toISOString().split('T')[0]}`,
        MovementType.EXIT_EXPIRED
      )
    )
  );
}

// ============================================================
// 5. RESERVAS
// ============================================================

/**
 * Reservar bolsa para paciente
 */
async function reserveBloodBag(
  companyId: string,
  bloodType: BloodType,
  patientId: string,
  userId: string,
  notes?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Buscar bolsa disponível (FIFO)
    const bloodBag = await tx.bloodBag.findFirst({
      where: {
        batch: { companyId },
        bloodType,
        status: BloodBagStatus.AVAILABLE,
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    if (!bloodBag) {
      throw new Error(`No blood bag available for type ${bloodType}`);
    }

    // Atualizar status
    const updated = await tx.bloodBag.update({
      where: { id: bloodBag.id },
      data: {
        status: BloodBagStatus.RESERVED,
        reservedFor: patientId,
        reservedAt: new Date(),
        reservedBy: userId,
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
        availableVolume: { decrement: bloodBag.volume },
        lastUpdated: new Date(),
      },
    });

    // Registrar movimento (opcional)
    const movement = await tx.movement.create({
      data: {
        companyId,
        bloodBagId: bloodBag.id,
        userId,
        type: MovementType.ADJUSTMENT,
        bloodType,
        quantity: 0, // Não altera quantidade total
        destination: patientId,
        notes: notes || `Reservado para paciente ${patientId}`,
      },
    });

    return { bloodBag: updated, movement };
  });
}

/**
 * Cancelar reserva
 */
async function cancelReservation(bloodBagId: string, userId: string, reason?: string) {
  return await prisma.$transaction(async (tx) => {
    const bloodBag = await tx.bloodBag.findUniqueOrThrow({
      where: { id: bloodBagId },
      include: { batch: true },
    });

    if (bloodBag.status !== BloodBagStatus.RESERVED) {
      throw new Error('Blood bag is not reserved');
    }

    // Atualizar status
    const updated = await tx.bloodBag.update({
      where: { id: bloodBagId },
      data: {
        status: BloodBagStatus.AVAILABLE,
        reservedFor: null,
        reservedAt: null,
        reservedBy: null,
      },
    });

    // Atualizar StockView
    await tx.stockView.update({
      where: {
        companyId_bloodType: {
          companyId: bloodBag.batch.companyId,
          bloodType: bloodBag.bloodType,
        },
      },
      data: {
        availableCount: { increment: 1 },
        reservedCount: { decrement: 1 },
        availableVolume: { increment: bloodBag.volume },
        lastUpdated: new Date(),
      },
    });

    // Registrar movimento
    const movement = await tx.movement.create({
      data: {
        companyId: bloodBag.batch.companyId,
        bloodBagId,
        userId,
        type: MovementType.ADJUSTMENT,
        bloodType: bloodBag.bloodType,
        quantity: 0,
        notes: `Reserva cancelada: ${reason || 'Não especificado'}`,
      },
    });

    return { bloodBag: updated, movement };
  });
}

// ============================================================
// 6. ALERTAS E MONITORAMENTO
// ============================================================

/**
 * Criar alerta de estoque baixo
 */
async function createLowStockAlert(
  companyId: string,
  bloodType: BloodType,
  threshold: number,
  currentValue: number
) {
  return await prisma.stockAlert.create({
    data: {
      companyId,
      bloodType,
      alertType: AlertType.LOW_STOCK,
      severity: currentValue === 0 ? 'CRITICAL' : currentValue < 3 ? 'HIGH' : 'MEDIUM',
      message: `Estoque de ${bloodType} está baixo: ${currentValue} unidades (mínimo: ${threshold})`,
      threshold,
      currentValue,
      isResolved: false,
    },
  });
}

/**
 * Criar alerta de vencimento próximo
 */
async function createExpiringSoonAlert(
  companyId: string,
  bloodType: BloodType,
  bagCount: number,
  oldestExpiration: Date
) {
  return await prisma.stockAlert.create({
    data: {
      companyId,
      bloodType,
      alertType: AlertType.EXPIRING_SOON,
      severity: 'HIGH',
      message: `${bagCount} bolsas de ${bloodType} vencendo em breve. Mais antiga: ${oldestExpiration.toISOString().split('T')[0]}`,
      currentValue: bagCount,
      isResolved: false,
    },
  });
}

/**
 * Buscar alertas ativos
 */
async function getActiveAlerts(companyId: string) {
  return await prisma.stockAlert.findMany({
    where: {
      companyId,
      isResolved: false,
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Verificar e criar alertas automaticamente
 */
async function checkAndCreateAlerts(companyId: string) {
  const MINIMUM_STOCK = 5; // Threshold configurável
  const EXPIRING_DAYS = 7;

  const stockViews = await prisma.stockView.findMany({
    where: { companyId },
  });

  for (const stock of stockViews) {
    // Alerta de estoque baixo
    if (stock.availableCount < MINIMUM_STOCK) {
      await createLowStockAlert(
        companyId,
        stock.bloodType,
        MINIMUM_STOCK,
        stock.availableCount
      );
    }

    // Alerta de vencimento próximo
    if (stock.expiringSoonCount > 0) {
      await createExpiringSoonAlert(
        companyId,
        stock.bloodType,
        stock.expiringSoonCount,
        stock.oldestExpirationDate!
      );
    }
  }
}

// ============================================================
// 7. RELATÓRIOS E AUDITORIA
// ============================================================

/**
 * Histórico completo de uma bolsa
 */
async function getBloodBagHistory(bloodBagId: string) {
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

/**
 * Relatório de movimentações por período
 */
async function getMovementReport(
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

/**
 * Relatório de perdas (vencimento + descarte)
 */
async function getLossReport(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.movement.groupBy({
    by: ['type', 'bloodType'],
    where: {
      companyId,
      type: {
        in: [MovementType.EXIT_EXPIRED, MovementType.EXIT_DISCARD],
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      quantity: true,
    },
  });
}

/**
 * Dashboard completo
 */
async function getDashboard(companyId: string) {
  const [stockSummary, activeAlerts, recentMovements, expiringSoon] = await Promise.all([
    getAllStockSummary(companyId),
    getActiveAlerts(companyId),
    prisma.movement.findMany({
      where: { companyId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
        bloodBag: {
          select: { bagCode: true },
        },
      },
    }),
    getExpiringSoonBags(companyId, 7),
  ]);

  return {
    stockSummary,
    activeAlerts,
    recentMovements,
    expiringSoon,
  };
}

// ============================================================
// 8. FUNÇÕES AUXILIARES
// ============================================================

/**
 * Recalcular StockView completo (job agendado)
 */
async function recalculateStockView(companyId: string) {
  const bloodTypes = Object.values(BloodType);

  for (const bloodType of bloodTypes) {
    const stats = await prisma.bloodBag.groupBy({
      by: ['status'],
      where: {
        batch: { companyId },
        bloodType,
      },
      _count: {
        id: true,
      },
      _sum: {
        volume: true,
      },
    });

    const availableCount = stats.find(s => s.status === BloodBagStatus.AVAILABLE)?._count.id || 0;
    const reservedCount = stats.find(s => s.status === BloodBagStatus.RESERVED)?._count.id || 0;
    const usedCount = stats.find(s => s.status === BloodBagStatus.USED)?._count.id || 0;
    const expiredCount = stats.find(s => s.status === BloodBagStatus.EXPIRED)?._count.id || 0;
    const discardedCount = stats.find(s => s.status === BloodBagStatus.DISCARDED)?._count.id || 0;

    const expiringSoon = await prisma.bloodBag.count({
      where: {
        batch: { companyId },
        bloodType,
        status: BloodBagStatus.AVAILABLE,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const oldestBag = await prisma.bloodBag.findFirst({
      where: {
        batch: { companyId },
        bloodType,
        status: BloodBagStatus.AVAILABLE,
      },
      orderBy: { expiresAt: 'asc' },
      select: { expiresAt: true },
    });

    await prisma.stockView.upsert({
      where: {
        companyId_bloodType: { companyId, bloodType },
      },
      create: {
        companyId,
        bloodType,
        availableCount,
        reservedCount,
        usedCount,
        expiredCount,
        discardedCount,
        expiringSoonCount: expiringSoon,
        totalVolume: (stats.reduce((acc, s) => acc + (s._sum.volume || 0), 0)),
        availableVolume: stats.find(s => s.status === BloodBagStatus.AVAILABLE)?._sum.volume || 0,
        oldestExpirationDate: oldestBag?.expiresAt,
        lastUpdated: new Date(),
      },
      update: {
        availableCount,
        reservedCount,
        usedCount,
        expiredCount,
        discardedCount,
        expiringSoonCount: expiringSoon,
        totalVolume: (stats.reduce((acc, s) => acc + (s._sum.volume || 0), 0)),
        availableVolume: stats.find(s => s.status === BloodBagStatus.AVAILABLE)?._sum.volume || 0,
        oldestExpirationDate: oldestBag?.expiresAt,
        lastUpdated: new Date(),
      },
    });
  }
}

// ============================================================
// 9. EXEMPLOS DE USO
// ============================================================

async function exampleUsage() {
  try {
    // 1. Criar empresa e usuário
    const company = await createCompany();
    const user = await createUser(company.id);

    console.log('✅ Empresa e usuário criados');

    // 2. Registrar entrada de lote (10 bolsas de A+)
    const entry = await registerBatchEntry(company.id, user.id, BloodType.A_POS, 10);
    console.log(`✅ Lote ${entry.batch.code} criado com ${entry.bloodBags.length} bolsas`);

    // 3. Consultar estoque
    const stock = await getStockSummary(company.id, BloodType.A_POS);
    console.log(`📊 Estoque A+: ${stock?.availableCount} disponíveis`);

    // 4. Reservar bolsa para paciente
    const reservation = await reserveBloodBag(
      company.id,
      BloodType.A_POS,
      'paciente-123',
      user.id
    );
    console.log(`🔒 Bolsa ${reservation.bloodBag.bagCode} reservada`);

    // 5. Registrar transfusão
    const transfusion = await registerTransfusion(
      company.id,
      BloodType.A_POS,
      'paciente-456',
      user.id
    );
    console.log(`💉 Transfusão realizada com bolsa ${transfusion.bloodBag.bagCode}`);

    // 6. Verificar alertas
    const expiringSoon = await getExpiringSoonBags(company.id, 7);
    console.log(`⚠️  ${expiringSoon.length} bolsas vencendo em 7 dias`);

    // 7. Dashboard
    const dashboard = await getDashboard(company.id);
    console.log('📈 Dashboard:', JSON.stringify(dashboard, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar exemplo (descomente para testar)
// exampleUsage();

// ============================================================
// 10. EXPORTS
// ============================================================

export {
  createCompany,
  createUser,
  registerBatchEntry,
  getStockSummary,
  getAllStockSummary,
  getAvailableBloodBags,
  getNextAvailableBag,
  getExpiringSoonBags,
  getExpiredBags,
  registerTransfusion,
  transferBloodBag,
  discardBloodBag,
  discardExpiredBags,
  reserveBloodBag,
  cancelReservation,
  createLowStockAlert,
  createExpiringSoonAlert,
  getActiveAlerts,
  checkAndCreateAlerts,
  getBloodBagHistory,
  getMovementReport,
  getLossReport,
  getDashboard,
  recalculateStockView,
};
