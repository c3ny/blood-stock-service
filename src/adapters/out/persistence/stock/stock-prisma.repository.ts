import { Injectable } from '@nestjs/common';
import {
  AtomicAdjustStockCommand,
  AtomicAdjustStockResult,
  ListStocksQuery,
  ListStocksResult,
  StockReadModel,
  StockRepositoryPort,
} from '@application/stock/ports';
import { StockNotFoundError } from '@application/stock/errors';
import { InsufficientStockError } from '@domain/errors';
import { StockItem, Quantity } from '@domain';
import { PrismaService } from '../prisma/prisma.service';
import { StockPrismaMapper } from './stock-prisma.mapper';

@Injectable()
export class StockPrismaRepository implements StockRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: StockPrismaMapper,
  ) {}

  async findById(id: string): Promise<StockItem | null> {
    const raw = await this.prisma.stockView.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return this.mapper.toDomain({
      id: raw.id,
      companyId: raw.companyId,
      bloodType: this.prismaToBloodType(raw.bloodType),
      ...this.toQuantities(raw.availableCount, raw.bloodType),
      createdAt: raw.lastUpdated,
      updatedAt: raw.lastUpdated,
    } as any);
  }

  async findReadById(id: string): Promise<StockReadModel | null> {
    const raw = await this.prisma.stockView.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      companyId: raw.companyId,
      bloodType: this.prismaToBloodType(raw.bloodType),
      ...this.toQuantities(raw.availableCount, raw.bloodType),
      createdAt: raw.lastUpdated,
      updatedAt: raw.lastUpdated,
    };
  }

  async findMany(query: ListStocksQuery): Promise<ListStocksResult> {
    const where: any = {};

    if (query.companyId) {
      where.companyId = query.companyId;
    }

    if (query.bloodType) {
      where.bloodType = this.bloodTypeToPrisma(query.bloodType);
    }

    const [items, total] = await Promise.all([
      this.prisma.stockView.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { lastUpdated: 'desc' },
      }),
      this.prisma.stockView.count({ where }),
    ]);

    return {
      items: items.map((raw: any) => ({
        id: raw.id,
        companyId: raw.companyId,
        bloodType: this.prismaToBloodType(raw.bloodType),
        ...this.toQuantities(raw.availableCount, raw.bloodType),
        createdAt: raw.lastUpdated,
        updatedAt: raw.lastUpdated,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async adjustAtomically(command: AtomicAdjustStockCommand): Promise<AtomicAdjustStockResult> {
    return this.prisma.$transaction(async (tx: any) => {
      const stock = await tx.stockView.findUnique({
        where: { id: command.stockId },
      });

      if (!stock) {
        throw new StockNotFoundError(command.stockId);
      }

      const nextAvailableCount = stock.availableCount + command.movement;
      if (nextAvailableCount < 0) {
        throw new InsufficientStockError(command.stockId, Math.abs(command.movement), stock.availableCount);
      }

      const nextAvailableVolume = Math.max(0, stock.availableVolume + command.movement * 450);

      await tx.stockView.update({
        where: { id: command.stockId },
        data: {
          availableCount: nextAvailableCount,
          availableVolume: nextAvailableVolume,
          totalVolume: nextAvailableVolume,
          lastUpdated: command.timestamp,
        },
      });

      const user = await tx.user.findFirst({
        where: { companyId: stock.companyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!user) {
        throw new Error(`No active user found for company ${stock.companyId}`);
      }

      await tx.movement.create({
        data: {
          id: command.movementId,
          companyId: stock.companyId,
          userId: user.id,
          type: command.movement >= 0 ? 'ENTRY_DONATION' : 'EXIT_TRANSFUSION',
          bloodType: stock.bloodType,
          quantity: Math.abs(command.movement),
          origin: command.actionBy,
          notes: command.notes,
          createdAt: command.timestamp,
        },
      });

      return {
        stockId: stock.id,
        companyId: stock.companyId,
        bloodType: this.prismaToBloodType(stock.bloodType),
        ...this.toAdjustResultQuantities(stock.availableCount, nextAvailableCount, stock.bloodType),
        timestamp: command.timestamp,
      };
    });
  }

  async save(stock: StockItem): Promise<void> {
    // V3 Migration: StockView is denormalized, derived from BloodBag table
    // No direct manipulation here - handled via Movement and BloodBag creation
    // This is now a no-op during the transition phase
  }

  private prismaToBloodType(prismaType: string): string {
    return prismaType.replace('_POS', '+').replace('_NEG', '-');
  }

  private bloodTypeToPrisma(domainType: string): string {
    return domainType.replace('+', '_POS').replace('-', '_NEG');
  }

  private getQuantityByBloodType(stock: StockItem): Quantity {
    const type = stock.getBloodType().getValue();
    if (type === 'A+' || type === 'A-') return stock.getQuantityA();
    if (type === 'B+' || type === 'B-') return stock.getQuantityB();
    if (type === 'AB+' || type === 'AB-') return stock.getQuantityAB();
    if (type === 'O+' || type === 'O-') return stock.getQuantityO();
    throw new Error(`Unknown blood type: ${type}`);
  }

  private toQuantities(quantity: number, bloodType: string): Pick<StockReadModel, 'quantityA' | 'quantityB' | 'quantityAB' | 'quantityO'> {
    if (bloodType.startsWith('A_')) {
      return { quantityA: quantity, quantityB: 0, quantityAB: 0, quantityO: 0 };
    }
    if (bloodType.startsWith('B_')) {
      return { quantityA: 0, quantityB: quantity, quantityAB: 0, quantityO: 0 };
    }
    if (bloodType.startsWith('AB_')) {
      return { quantityA: 0, quantityB: 0, quantityAB: quantity, quantityO: 0 };
    }
    return { quantityA: 0, quantityB: 0, quantityAB: 0, quantityO: quantity };
  }

  private toAdjustResultQuantities(before: number, after: number, bloodType: string): Omit<AtomicAdjustStockResult, 'stockId' | 'companyId' | 'bloodType' | 'timestamp'> {
    const beforeQuantities = this.toQuantities(before, bloodType);
    const afterQuantities = this.toQuantities(after, bloodType);

    return {
      quantityABefore: beforeQuantities.quantityA,
      quantityBBefore: beforeQuantities.quantityB,
      quantityABBefore: beforeQuantities.quantityAB,
      quantityOBefore: beforeQuantities.quantityO,
      quantityAAfter: afterQuantities.quantityA,
      quantityBAfter: afterQuantities.quantityB,
      quantityABAfter: afterQuantities.quantityAB,
      quantityOAfter: afterQuantities.quantityO,
    };
  }
}
