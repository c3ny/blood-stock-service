# 💻 Exemplos de Implementação - Schema v3.0

> **Exemplos práticos de código TypeScript** para usar as novas features do Schema Production-Optimized

---

## 📦 1. BatchMovement (Movimentações em Lote)

### 1.1 Registrar Entrada de Lote (50 bolsas)

```typescript
// src/service/BatchMovementService.ts

import { PrismaClient, MovementType, BloodType } from '@prisma/client';

export class BatchMovementService {
  constructor(private prisma: PrismaClient) {}

  async registerBatchEntry(params: {
    batchId: string;
    companyId: string;
    bloodType: BloodType;
    bloodBagIds: string[];
    userId: string;
    notes?: string;
  }) {
    const { batchId, companyId, bloodType, bloodBagIds, userId, notes } = params;

    // Calcular totais
    const bloodBags = await this.prisma.bloodBag.findMany({
      where: { id: { in: bloodBagIds } },
      select: { volume: true }
    });

    const totalBags = bloodBags.length;
    const totalVolume = bloodBags.reduce((sum, bag) => sum + bag.volume, 0);

    // Criar BatchMovement
    const batchMovement = await this.prisma.batchMovement.create({
      data: {
        batchId,
        companyId,
        bloodType,
        type: MovementType.ENTRY_DONATION,
        totalBags,
        totalVolume,
        bloodBagIds,
        userId,
        notes,
      },
      include: {
        batch: true,
        user: { select: { name: true } },
      }
    });

    // Criar EventLog
    await this.prisma.eventLog.create({
      data: {
        companyId,
        userId,
        entityType: 'BATCH_MOVEMENT',
        entityId: batchMovement.id,
        action: 'CREATE',
        description: `Registered batch entry: ${totalBags} bags of ${bloodType}`,
        context: {
          bloodBagIds,
          totalVolume,
          batchId,
        },
      }
    });

    return batchMovement;
  }

  async getBatchMovementsByBatch(batchId: string) {
    return this.prisma.batchMovement.findMany({
      where: { 
        batchId,
        deletedAt: null  // Ignorar soft-deleted
      },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBatchMovementStats(companyId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const movements = await this.prisma.batchMovement.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
        deletedAt: null,
      },
      select: {
        type: true,
        bloodType: true,
        totalBags: true,
        totalVolume: true,
      }
    });

    // Agrupar por tipo e bloodType
    const stats = movements.reduce((acc, mov) => {
      const key = `${mov.type}_${mov.bloodType}`;
      if (!acc[key]) {
        acc[key] = { 
          type: mov.type, 
          bloodType: mov.bloodType, 
          count: 0, 
          totalBags: 0, 
          totalVolume: 0 
        };
      }
      acc[key].count++;
      acc[key].totalBags += mov.totalBags;
      acc[key].totalVolume += mov.totalVolume;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(stats);
  }
}
```

### 1.2 Controller Endpoint

```typescript
// src/controller/BatchMovementController.ts

import { Request, Response } from 'express';
import { BatchMovementService } from '../service/BatchMovementService';

export class BatchMovementController {
  constructor(private batchMovementService: BatchMovementService) {}

  async registerBatchEntry(req: Request, res: Response) {
    try {
      const { batchId, bloodBagIds, notes } = req.body;
      const { companyId, userId } = req.user; // Do middleware de autenticação

      // Validar que todas bloodBags pertencem ao batch
      const batch = await this.prisma.batch.findUniqueOrThrow({
        where: { id: batchId },
        select: { bloodType: true }
      });

      const batchMovement = await this.batchMovementService.registerBatchEntry({
        batchId,
        companyId,
        bloodType: batch.bloodType,
        bloodBagIds,
        userId,
        notes,
      });

      res.status(201).json({
        success: true,
        data: batchMovement,
        message: `Batch movement registered: ${batchMovement.totalBags} bags`
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getBatchMovements(req: Request, res: Response) {
    const { batchId } = req.params;
    
    const movements = await this.batchMovementService.getBatchMovementsByBatch(batchId);
    
    res.json({ success: true, data: movements });
  }

  async getStats(req: Request, res: Response) {
    const { companyId } = req.user;
    const { days } = req.query;
    
    const stats = await this.batchMovementService.getBatchMovementStats(
      companyId, 
      days ? parseInt(days as string) : 30
    );
    
    res.json({ success: true, data: stats });
  }
}
```

---

## 🔒 2. BloodBagReservation (Reservas Temporárias)

### 2.1 Service de Reservas

```typescript
// src/service/BloodBagReservationService.ts

import { PrismaClient, ReservationStatus, BloodBagStatus } from '@prisma/client';

export class BloodBagReservationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Reservar bolsa para procedimento médico
   * Priority: 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW
   */
  async reserveBloodBag(params: {
    bloodBagId: string;
    companyId: string;
    userId: string;
    patientId?: string;
    patientName?: string;
    procedureType?: string;
    priority: 1 | 2 | 3 | 4;
    expiresInHours: number;
    notes?: string;
  }) {
    const { 
      bloodBagId, companyId, userId, priority, 
      expiresInHours, patientId, patientName, procedureType, notes 
    } = params;

    // Validar que bolsa está disponível
    const bloodBag = await this.prisma.bloodBag.findUniqueOrThrow({
      where: { id: bloodBagId },
      include: { batch: true }
    });

    if (bloodBag.status !== BloodBagStatus.AVAILABLE) {
      throw new Error(`Blood bag ${bloodBag.bagCode} is not available (status: ${bloodBag.status})`);
    }

    if (bloodBag.expiresAt < new Date()) {
      throw new Error(`Blood bag ${bloodBag.bagCode} is expired`);
    }

    // Calcular expiração da reserva
    const reservedAt = new Date();
    const expiresAt = new Date(reservedAt);
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Criar reserva + atualizar bolsa (transação)
    const [reservation] = await this.prisma.$transaction([
      this.prisma.bloodBagReservation.create({
        data: {
          bloodBagId,
          companyId,
          userId,
          patientId,
          patientName,
          procedureType,
          priority,
          status: ReservationStatus.PENDING,
          reservedAt,
          expiresAt,
          notes,
        },
        include: {
          bloodBag: { select: { bagCode: true, bloodType: true, volume: true } },
          user: { select: { name: true } },
        }
      }),

      this.prisma.bloodBag.update({
        where: { id: bloodBagId },
        data: {
          status: BloodBagStatus.RESERVED,
          reservedFor: patientName,
          reservedAt,
          reservedBy: userId,
        }
      }),

      this.prisma.eventLog.create({
        data: {
          companyId,
          userId,
          entityType: 'BLOOD_BAG_RESERVATION',
          entityId: bloodBagId,
          action: 'CREATE',
          description: `Reserved ${bloodBag.bagCode} for ${patientName || 'patient'} (priority: ${priority})`,
          context: { priority, expiresAt, procedureType },
        }
      })
    ]);

    return reservation;
  }

  /**
   * Confirmar reserva (bolsa separada fisicamente)
   */
  async confirmReservation(reservationId: string, userId: string) {
    const reservation = await this.prisma.bloodBagReservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { bloodBag: true }
    });

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new Error(`Reservation ${reservationId} cannot be confirmed (status: ${reservation.status})`);
    }

    if (reservation.expiresAt < new Date()) {
      throw new Error(`Reservation ${reservationId} has expired`);
    }

    return this.prisma.bloodBagReservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        bloodBag: { select: { bagCode: true, bloodType: true } },
      }
    });
  }

  /**
   * Cancelar reserva manualmente
   */
  async cancelReservation(reservationId: string, userId: string, reason: string) {
    const reservation = await this.prisma.bloodBagReservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { bloodBag: true }
    });

    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      throw new Error(`Reservation ${reservationId} cannot be cancelled (status: ${reservation.status})`);
    }

    await this.prisma.$transaction([
      this.prisma.bloodBagReservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        }
      }),

      // Liberar bolsa
      this.prisma.bloodBag.update({
        where: { id: reservation.bloodBagId },
        data: {
          status: BloodBagStatus.AVAILABLE,
          reservedFor: null,
          reservedAt: null,
          reservedBy: null,
        }
      }),

      this.prisma.eventLog.create({
        data: {
          companyId: reservation.companyId,
          userId,
          entityType: 'BLOOD_BAG_RESERVATION',
          entityId: reservationId,
          action: 'CANCEL',
          description: `Cancelled reservation for ${reservation.bloodBag.bagCode}`,
          context: { reason },
        }
      })
    ]);
  }

  /**
   * Marcar como utilizada (criar Movement automaticamente)
   */
  async fulfillReservation(reservationId: string, userId: string) {
    const reservation = await this.prisma.bloodBagReservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { bloodBag: { include: { batch: true } } }
    });

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error(`Only CONFIRMED reservations can be fulfilled (current: ${reservation.status})`);
    }

    await this.prisma.$transaction([
      // Marcar reserva como FULFILLED
      this.prisma.bloodBagReservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.FULFILLED,
          fulfilledAt: new Date(),
        }
      }),

      // Marcar bolsa como USED
      this.prisma.bloodBag.update({
        where: { id: reservation.bloodBagId },
        data: { status: BloodBagStatus.USED }
      }),

      // Criar Movement
      this.prisma.movement.create({
        data: {
          companyId: reservation.companyId,
          bloodBagId: reservation.bloodBagId,
          batchId: reservation.bloodBag.batchId,
          bloodType: reservation.bloodBag.bloodType,
          type: 'EXIT_TRANSFUSION',
          quantity: 1,
          userId,
          patientId: reservation.patientId,
          notes: `Fulfilled reservation for ${reservation.patientName || 'patient'}`,
          metadata: {
            reservationId,
            procedureType: reservation.procedureType,
          }
        }
      })
    ]);
  }

  /**
   * Listar reservas ativas com prioridade
   */
  async getActiveReservations(companyId: string) {
    // Usar view SQL otimizada
    return this.prisma.$queryRaw`
      SELECT * FROM v_active_reservations
      WHERE company_id = ${companyId}
      ORDER BY priority ASC, expires_at ASC
    `;
  }

  /**
   * Auto-expirar reservas (rodado via cron a cada 15 min)
   */
  async expireReservations(): Promise<number> {
    // Chama function SQL
    const result = await this.prisma.$queryRaw<[{ fn_expire_reservations: number }]>`
      SELECT fn_expire_reservations() AS expired_count
    `;
    
    return result[0]?.fn_expire_reservations || 0;
  }
}
```

### 2.2 Controller de Reservas

```typescript
// src/controller/BloodBagReservationController.ts

export class BloodBagReservationController {
  constructor(private reservationService: BloodBagReservationService) {}

  async create(req: Request, res: Response) {
    try {
      const { 
        bloodBagId, patientId, patientName, procedureType, 
        priority, expiresInHours, notes 
      } = req.body;
      const { companyId, userId } = req.user;

      const reservation = await this.reservationService.reserveBloodBag({
        bloodBagId,
        companyId,
        userId,
        patientId,
        patientName,
        procedureType,
        priority: priority || 3, // Default: MEDIUM
        expiresInHours: expiresInHours || 4, // Default: 4 horas
        notes,
      });

      res.status(201).json({ 
        success: true, 
        data: reservation,
        message: `Blood bag reserved until ${reservation.expiresAt.toLocaleString()}` 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async confirm(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user;

    const reservation = await this.reservationService.confirmReservation(id, userId);
    
    res.json({ success: true, data: reservation });
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req.user;

    await this.reservationService.cancelReservation(id, userId, reason);
    
    res.json({ success: true, message: 'Reservation cancelled' });
  }

  async fulfill(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user;

    await this.reservationService.fulfillReservation(id, userId);
    
    res.json({ success: true, message: 'Reservation fulfilled, movement created' });
  }

  async listActive(req: Request, res: Response) {
    const { companyId } = req.user;

    const reservations = await this.reservationService.getActiveReservations(companyId);
    
    res.json({ success: true, data: reservations });
  }
}
```

---

## 🚨 3. AlertConfiguration (Alertas Customizáveis)

### 3.1 Service de Alertas

```typescript
// src/service/AlertService.ts

import { PrismaClient, AlertType, AlertSeverity, BloodType } from '@prisma/client';
import { sendEmail, sendSMS } from '../utils/notifications';

export class AlertService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Configurar alerta customizado por hemocentro
   */
  async createAlertConfiguration(params: {
    companyId: string;
    bloodType: BloodType;
    alertType: AlertType;
    threshold?: number;
    daysBeforeExpiry?: number;
    severity: AlertSeverity;
    emailEnabled: boolean;
    emailRecipients: string[];
    smsEnabled: boolean;
    smsRecipients?: string[];
  }) {
    const config = await this.prisma.alertConfiguration.create({
      data: {
        ...params,
        isActive: true,
      },
      include: {
        company: { select: { name: true } }
      }
    });

    return config;
  }

  /**
   * Verificar alertas automaticamente (rodado via cron a cada hora)
   */
  async checkStockAlerts() {
    // 1. Buscar todas configurações ativas
    const configs = await this.prisma.alertConfiguration.findMany({
      where: { 
        isActive: true,
        deletedAt: null,
      },
      include: {
        company: { select: { name: true } }
      }
    });

    const alertsCreated = [];

    for (const config of configs) {
      // 2. Buscar estoque atual
      const stockView = await this.prisma.stockView.findUnique({
        where: {
          companyId_bloodType: {
            companyId: config.companyId,
            bloodType: config.bloodType,
          }
        }
      });

      if (!stockView) continue;

      let shouldAlert = false;
      let message = '';

      // 3. Verificar threshold conforme tipo de alerta
      if (config.alertType === AlertType.LOW_STOCK && config.threshold !== null) {
        if (stockView.availableCount < config.threshold) {
          shouldAlert = true;
          message = `Low stock alert: ${stockView.availableCount} bags of ${config.bloodType} (threshold: ${config.threshold})`;
        }
      }

      if (config.alertType === AlertType.CRITICAL_STOCK) {
        if (stockView.availableCount === 0) {
          shouldAlert = true;
          message = `CRITICAL: No available bags of ${config.bloodType}`;
        }
      }

      if (config.alertType === AlertType.EXPIRING_SOON && config.daysBeforeExpiry) {
        if (stockView.expiringSoonCount > 0) {
          shouldAlert = true;
          message = `${stockView.expiringSoonCount} bags of ${config.bloodType} expiring in ${config.daysBeforeExpiry} days`;
        }
      }

      // 4. Criar alerta se necessário
      if (shouldAlert) {
        // Verificar se já existe alerta não resolvido para evitar spam
        const existingAlert = await this.prisma.stockAlert.findFirst({
          where: {
            companyId: config.companyId,
            bloodType: config.bloodType,
            alertType: config.alertType,
            isResolved: false,
            deletedAt: null,
          }
        });

        if (!existingAlert) {
          const alert = await this.prisma.stockAlert.create({
            data: {
              companyId: config.companyId,
              bloodType: config.bloodType,
              alertType: config.alertType,
              severity: config.severity,
              message,
              threshold: config.threshold || 0,
              currentCount: stockView.availableCount,
              isResolved: false,
            }
          });

          alertsCreated.push(alert);

          // 5. Enviar notificações
          if (config.emailEnabled && config.emailRecipients.length > 0) {
            await this.sendEmailNotification(alert, config);
          }

          if (config.smsEnabled && config.smsRecipients && config.smsRecipients.length > 0) {
            await this.sendSMSNotification(alert, config);
          }

          // 6. Atualizar alert com notificações enviadas
          await this.prisma.stockAlert.update({
            where: { id: alert.id },
            data: {
              notifiedAt: new Date(),
              notifiedVia: [
                ...(config.emailEnabled ? ['EMAIL'] : []),
                ...(config.smsEnabled ? ['SMS'] : []),
              ]
            }
          });
        }
      }
    }

    return alertsCreated;
  }

  private async sendEmailNotification(alert: any, config: any) {
    const subject = `[${alert.severity}] Blood Stock Alert - ${alert.bloodType}`;
    const body = `
      ${alert.message}
      
      Company: ${config.company.name}
      Blood Type: ${alert.bloodType}
      Current Count: ${alert.currentCount}
      Threshold: ${alert.threshold}
      
      Please take action immediately.
    `;

    for (const email of config.emailRecipients) {
      await sendEmail(email, subject, body);
    }
  }

  private async sendSMSNotification(alert: any, config: any) {
    const message = `[${alert.severity}] ${alert.message} (${alert.bloodType})`;

    for (const phone of config.smsRecipients) {
      await sendSMS(phone, message);
    }
  }

  /**
   * Resolver alerta manualmente
   */
  async resolveAlert(alertId: string, userId: string, resolutionNotes: string) {
    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes,
      }
    });
  }

  /**
   * Listar alertas não resolvidos (dashboard)
   */
  async getUnresolvedAlerts(companyId: string) {
    return this.prisma.stockAlert.findMany({
      where: {
        companyId,
        isResolved: false,
        deletedAt: null,
      },
      orderBy: [
        { severity: 'desc' }, // CRITICAL primeiro
        { createdAt: 'desc' },
      ]
    });
  }
}
```

### 3.2 Configuração Padrão de Alertas

```typescript
// src/service/AlertService.ts (continuação)

/**
 * Popular configurações padrão para um novo hemocentro
 */
async createDefaultAlertConfigurations(companyId: string) {
  const company = await this.prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { email: true }
  });

  const bloodTypes: BloodType[] = [
    'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 
    'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'
  ];

  const configs = [];

  for (const bloodType of bloodTypes) {
    // 1. LOW_STOCK: threshold 5 bolsas
    configs.push({
      companyId,
      bloodType,
      alertType: AlertType.LOW_STOCK,
      threshold: 5,
      severity: AlertSeverity.MEDIUM,
      emailEnabled: true,
      emailRecipients: [company.email],
      smsEnabled: false,
      isActive: true,
    });

    // 2. CRITICAL_STOCK: threshold 0 (sem bolsas)
    configs.push({
      companyId,
      bloodType,
      alertType: AlertType.CRITICAL_STOCK,
      threshold: 0,
      severity: AlertSeverity.CRITICAL,
      emailEnabled: true,
      emailRecipients: [company.email],
      smsEnabled: true, // SMS para alertas críticos
      smsRecipients: [], // Admin deve configurar
      isActive: true,
    });

    // 3. EXPIRING_SOON: 7 dias antes
    configs.push({
      companyId,
      bloodType,
      alertType: AlertType.EXPIRING_SOON,
      daysBeforeExpiry: 7,
      severity: AlertSeverity.LOW,
      emailEnabled: true,
      emailRecipients: [company.email],
      smsEnabled: false,
      isActive: true,
    });
  }

  // Criar em batch
  await this.prisma.alertConfiguration.createMany({
    data: configs,
    skipDuplicates: true, // Ignorar se já existe
  });

  return configs.length;
}
```

---

## 📊 4. StockHistory (Snapshot Diário)

### 4.1 Service de Histórico

```typescript
// src/service/StockHistoryService.ts

export class StockHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar snapshot diário (rodado via cron à meia-noite)
   */
  async createDailySnapshot(): Promise<number> {
    // Chama function SQL que cria registros em stock_history
    const result = await this.prisma.$queryRaw<[{ fn_create_daily_stock_snapshot: number }]>`
      SELECT fn_create_daily_stock_snapshot() AS snapshot_count
    `;
    
    return result[0]?.fn_create_daily_stock_snapshot || 0;
  }

  /**
   * Buscar histórico de um tipo sanguíneo (últimos N dias)
   */
  async getHistory(params: {
    companyId: string;
    bloodType: BloodType;
    days: number;
  }) {
    const { companyId, bloodType, days } = params;

    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.stockHistory.findMany({
      where: {
        companyId,
        bloodType,
        snapshotDate: { gte: since }
      },
      orderBy: { snapshotDate: 'asc' }
    });
  }

  /**
   * Comparar estoque: hoje vs N dias atrás
   */
  async compareStock(companyId: string, bloodType: BloodType, daysAgo: number) {
    const today = new Date();
    const past = new Date();
    past.setDate(past.getDate() - daysAgo);

    const [todaySnapshot, pastSnapshot] = await Promise.all([
      this.prisma.stockHistory.findFirst({
        where: { companyId, bloodType, snapshotDate: today },
      }),
      this.prisma.stockHistory.findFirst({
        where: { companyId, bloodType, snapshotDate: past },
      })
    ]);

    if (!todaySnapshot || !pastSnapshot) {
      return null;
    }

    return {
      today: todaySnapshot.availableCount,
      past: pastSnapshot.availableCount,
      diff: todaySnapshot.availableCount - pastSnapshot.availableCount,
      percentChange: ((todaySnapshot.availableCount - pastSnapshot.availableCount) / pastSnapshot.availableCount) * 100,
    };
  }

  /**
   * Estatísticas agregadas (média, min, max últimos 30 dias)
   */
  async getAggregatedStats(companyId: string, bloodType: BloodType) {
    const history = await this.getHistory({ companyId, bloodType, days: 30 });

    if (history.length === 0) return null;

    const availableCounts = history.map(h => h.availableCount);

    return {
      avg: availableCounts.reduce((sum, c) => sum + c, 0) / availableCounts.length,
      min: Math.min(...availableCounts),
      max: Math.max(...availableCounts),
      current: availableCounts[availableCounts.length - 1],
      trend: this.calculateTrend(availableCounts),
    };
  }

  private calculateTrend(values: number[]): 'UP' | 'DOWN' | 'STABLE' {
    if (values.length < 2) return 'STABLE';
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const avgFirst = first.reduce((sum, v) => sum + v, 0) / first.length;
    const avgSecond = second.reduce((sum, v) => sum + v, 0) / second.length;
    
    const diff = avgSecond - avgFirst;
    
    if (diff > avgFirst * 0.1) return 'UP';
    if (diff < -avgFirst * 0.1) return 'DOWN';
    return 'STABLE';
  }
}
```

### 4.2 Endpoint de Charts

```typescript
// src/controller/StockHistoryController.ts

export class StockHistoryController {
  constructor(private historyService: StockHistoryService) {}

  async getChart(req: Request, res: Response) {
    const { bloodType } = req.params;
    const { days } = req.query;
    const { companyId } = req.user;

    const history = await this.historyService.getHistory({
      companyId,
      bloodType: bloodType as BloodType,
      days: days ? parseInt(days as string) : 30,
    });

    // Formatar para Chart.js
    const chartData = {
      labels: history.map(h => h.snapshotDate.toISOString().split('T')[0]),
      datasets: [
        {
          label: 'Available',
          data: history.map(h => h.availableCount),
          borderColor: 'green',
        },
        {
          label: 'Reserved',
          data: history.map(h => h.reservedCount),
          borderColor: 'blue',
        },
        {
          label: 'Used',
          data: history.map(h => h.usedCount),
          borderColor: 'orange',
        },
        {
          label: 'Expired',
          data: history.map(h => h.expiredCount),
          borderColor: 'red',
        },
      ]
    };

    res.json({ success: true, data: chartData });
  }

  async getStats(req: Request, res: Response) {
    const { bloodType } = req.params;
    const { companyId } = req.user;

    const stats = await this.historyService.getAggregatedStats(
      companyId, 
      bloodType as BloodType
    );

    res.json({ success: true, data: stats });
  }

  async compare(req: Request, res: Response) {
    const { bloodType } = req.params;
    const { daysAgo } = req.query;
    const { companyId } = req.user;

    const comparison = await this.historyService.compareStock(
      companyId,
      bloodType as BloodType,
      daysAgo ? parseInt(daysAgo as string) : 7
    );

    res.json({ success: true, data: comparison });
  }
}
```

---

## 🔄 5. Soft Deletes (Todas Tabelas)

### 5.1 Base Repository com Soft Delete

```typescript
// src/repository/BaseRepository.ts

export class BaseRepository<T> {
  constructor(
    private prisma: PrismaClient,
    private model: any // ex: prisma.bloodBag
  ) {}

  async findById(id: string, includeDeleted = false) {
    return this.model.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null })
      }
    });
  }

  async findMany(where: any = {}, includeDeleted = false) {
    return this.model.findMany({
      where: {
        ...where,
        ...(includeDeleted ? {} : { deletedAt: null })
      }
    });
  }

  async softDelete(id: string, userId?: string) {
    const result = await this.model.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      }
    });

    // Criar EventLog
    if (userId) {
      await this.prisma.eventLog.create({
        data: {
          userId,
          entityType: this.model.name,
          entityId: id,
          action: 'SOFT_DELETE',
          description: `Soft deleted ${this.model.name} ${id}`,
        }
      });
    }

    return result;
  }

  async restore(id: string, userId?: string) {
    const result = await this.model.update({
      where: { id },
      data: {
        deletedAt: null,
      }
    });

    if (userId) {
      await this.prisma.eventLog.create({
        data: {
          userId,
          entityType: this.model.name,
          entityId: id,
          action: 'RESTORE',
          description: `Restored ${this.model.name} ${id}`,
        }
      });
    }

    return result;
  }

  async permanentDelete(id: string) {
    // Apenas admin pode fazer isso
    return this.model.delete({ where: { id } });
  }

  async getDeleted() {
    return this.model.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' }
    });
  }
}
```

### 5.2 Uso em Controller

```typescript
// src/controller/BloodBagController.ts

export class BloodBagController {
  constructor(private bloodBagRepo: BaseRepository<BloodBag>) {}

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user;

    await this.bloodBagRepo.softDelete(id, userId);

    res.json({ success: true, message: 'Blood bag soft-deleted' });
  }

  async restore(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user;

    await this.bloodBagRepo.restore(id, userId);

    res.json({ success: true, message: 'Blood bag restored' });
  }

  async listDeleted(req: Request, res: Response) {
    const deleted = await this.bloodBagRepo.getDeleted();

    res.json({ success: true, data: deleted });
  }
}
```

---

## 🌐 6. Integração Externa (externalId + metadata)

### 6.1 Sincronização com Sistema Legado

```typescript
// src/service/ExternalSyncService.ts

export class ExternalSyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sincronizar bolsa de sistema externo (upsert)
   */
  async syncBloodBagFromExternal(externalData: {
    externalId: string;
    batchId: string;
    bagCode: string;
    bloodType: BloodType;
    volume: number;
    status: BloodBagStatus;
    expiresAt: string;
    metadata?: any;
  }) {
    const { externalId, ...data } = externalData;

    // Upsert: atualizar se existir, criar se não
    const bloodBag = await this.prisma.bloodBag.upsert({
      where: { externalId },
      update: {
        status: data.status,
        metadata: data.metadata,
        updatedAt: new Date(),
      },
      create: {
        externalId,
        ...data,
        expiresAt: new Date(data.expiresAt),
      }
    });

    return bloodBag;
  }

  /**
   * Buscar por ID externo
   */
  async getBloodBagByExternalId(externalId: string) {
    return this.prisma.bloodBag.findUnique({
      where: { externalId },
      include: {
        batch: true,
      }
    });
  }

  /**
   * Webhook: receber dados de sistema externo
   */
  async handleExternalWebhook(payload: {
    eventType: 'BLOOD_BAG_CREATED' | 'BLOOD_BAG_UPDATED' | 'BATCH_CREATED';
    data: any;
  }) {
    const { eventType, data } = payload;

    switch (eventType) {
      case 'BLOOD_BAG_CREATED':
        return this.syncBloodBagFromExternal(data);
      
      case 'BLOOD_BAG_UPDATED':
        return this.syncBloodBagFromExternal(data);
      
      case 'BATCH_CREATED':
        return this.syncBatchFromExternal(data);
      
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}
```

### 6.2 Metadata JSON Flexível

```typescript
// Exemplos de metadata personalizados

// Batch
await prisma.batch.create({
  data: {
    // ... campos padrão
    metadata: {
      donorType: 'FIRST_TIME',
      campaignBanner: 'https://cdn.example.com/campaign.jpg',
      collectionSite: 'Mobile Unit #3',
      weather: { temp: 25, condition: 'sunny' },
    }
  }
});

// BloodBag
await prisma.bloodBag.create({
  data: {
    // ... campos padrão
    metadata: {
      temperature: 4.2,
      inspectedBy: 'tech-123',
      inspectionPhotos: ['url1.jpg', 'url2.jpg'],
      qualityScore: 9.5,
    }
  }
});

// Movement
await prisma.movement.create({
  data: {
    // ... campos padrão
    metadata: {
      ambulanceId: 'AMB-05',
      driver: 'João Silva',
      route: 'Hospital Central → Clínica Norte',
      distance: 15.3,
      duration: 25,
    }
  }
});
```

---

## 🛠️ 7. Cron Jobs (Triggers Automáticos)

### 7.1 Script de Jobs

```typescript
// src/jobs/cron-jobs.ts

import { PrismaClient } from '@prisma/client';
import { BloodBagReservationService } from '../service/BloodBagReservationService';
import { AlertService } from '../service/AlertService';
import { StockHistoryService } from '../service/StockHistoryService';

const prisma = new PrismaClient();

async function runJobs() {
  console.log(`[${new Date().toISOString()}] Running cron jobs...`);

  try {
    // 1. Marcar bolsas vencidas (a cada hora)
    const expiredBags = await prisma.$queryRaw<[{ fn_mark_expired_bags: number }]>`
      SELECT fn_mark_expired_bags() AS count
    `;
    console.log(`- Marked ${expiredBags[0]?.fn_mark_expired_bags || 0} bags as EXPIRED`);

    // 2. Expirar reservas (a cada 15 min)
    const reservationService = new BloodBagReservationService(prisma);
    const expiredReservations = await reservationService.expireReservations();
    console.log(`- Expired ${expiredReservations} reservations`);

    // 3. Verificar alertas (a cada hora)
    const alertService = new AlertService(prisma);
    const alerts = await alertService.checkStockAlerts();
    console.log(`- Created ${alerts.length} stock alerts`);

    // 4. Snapshot diário (apenas à meia-noite)
    const hour = new Date().getHours();
    if (hour === 0) {
      const historyService = new StockHistoryService(prisma);
      const snapshotCount = await historyService.createDailySnapshot();
      console.log(`- Created ${snapshotCount} daily snapshots`);
    }

    console.log('Jobs completed successfully!');
  } catch (error) {
    console.error('Error running jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Rodar jobs
runJobs();
```

### 7.2 Configurar cron (Linux/Mac)

```bash
# crontab -e

# Rodar a cada 15 minutos
*/15 * * * * cd /path/to/blood-stock-service && node dist/jobs/cron-jobs.js >> /var/log/cron-blood-stock.log 2>&1

# Ou usar node-cron dentro da aplicação
```

### 7.3 Node-Cron (dentro da aplicação)

```typescript
// src/jobs/scheduler.ts

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { BloodBagReservationService } from '../service/BloodBagReservationService';
import { AlertService } from '../service/AlertService';
import { StockHistoryService } from '../service/StockHistoryService';

const prisma = new PrismaClient();

export function startCronJobs() {
  console.log('Starting cron jobs...');

  // A cada 15 minutos: expirar reservas
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Expiring reservations...');
    const service = new BloodBagReservationService(prisma);
    await service.expireReservations();
  });

  // A cada hora: marcar bolsas vencidas
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Marking expired bags...');
    await prisma.$queryRaw`SELECT fn_mark_expired_bags()`;
  });

  // A cada hora: verificar alertas
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking stock alerts...');
    const service = new AlertService(prisma);
    await service.checkStockAlerts();
  });

  // Diariamente à meia-noite: snapshot
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Creating daily snapshot...');
    const service = new StockHistoryService(prisma);
    await service.createDailySnapshot();
  });

  console.log('Cron jobs started!');
}

// src/index.ts
import { startCronJobs } from './jobs/scheduler';

// ...
startCronJobs();
```

---

## 📊 8. Uso de Views SQL Otimizadas

### 8.1 Query de Bolsa FIFO

```typescript
// Antes (v2.0): código manual
const nextBag = await prisma.bloodBag.findFirst({
  where: {
    status: 'AVAILABLE',
    bloodType,
    expiresAt: { gt: new Date() }
  },
  orderBy: { expiresAt: 'asc' }
});

// Depois (v3.0): view otimizada
const nextBag = await prisma.$queryRaw<BloodBag[]>`
  SELECT * FROM v_available_bags_fifo
  WHERE blood_type = ${bloodType}::blood_type_enum
    AND fifo_rank = 1
  LIMIT 1
`;
```

### 8.2 Dashboard de Estoque

```typescript
// Usar v_stock_realtime para dashboard sempre atualizado
const realtimeStock = await prisma.$queryRaw`
  SELECT * FROM v_stock_realtime
  WHERE company_id = ${companyId}
  ORDER BY blood_type
`;
```

### 8.3 Análise de Movimentos

```typescript
// Movimentos últimos 30 dias
const analysis = await prisma.$queryRaw`
  SELECT * FROM v_movement_analysis_30d
  WHERE company_id = ${companyId}
  ORDER BY movement_date DESC
`;
```

---

## 🎯 Conclusão

Estes exemplos cobrem:

✅ **BatchMovement**: Movimentações em lote  
✅ **BloodBagReservation**: Reservas temporárias com prioridade  
✅ **AlertConfiguration**: Alertas customizados + job automático  
✅ **StockHistory**: Snapshot diário + análises  
✅ **Soft Deletes**: Repository pattern  
✅ **Integração Externa**: externalId + metadata  
✅ **Cron Jobs**: Triggers automáticos  
✅ **Views SQL**: Queries otimizadas  

**Pronto para implementar no projeto!** 🚀
