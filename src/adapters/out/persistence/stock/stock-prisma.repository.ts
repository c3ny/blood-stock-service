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
    const raw = await this.prisma.stock.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return this.mapper.toDomain(raw);
  }

  async findReadById(id: string): Promise<StockReadModel | null> {
    const raw = await this.prisma.stock.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      companyId: raw.companyId,
      bloodType: this.prismaToBloodType(raw.bloodType),
      quantityA: raw.quantityA,
      quantityB: raw.quantityB,
      quantityAB: raw.quantityAB,
      quantityO: raw.quantityO,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
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
      this.prisma.stock.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stock.count({ where }),
    ]);

    return {
      items: items.map((raw) => ({
        id: raw.id,
        companyId: raw.companyId,
        bloodType: this.prismaToBloodType(raw.bloodType),
        quantityA: raw.quantityA,
        quantityB: raw.quantityB,
        quantityAB: raw.quantityAB,
        quantityO: raw.quantityO,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async adjustAtomically(command: AtomicAdjustStockCommand): Promise<AtomicAdjustStockResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "stock" WHERE id = ${command.stockId} FOR UPDATE`;

      const raw = await tx.stock.findUnique({
        where: { id: command.stockId },
      });

      if (!raw) {
        throw new StockNotFoundError(command.stockId);
      }

      const stock = this.mapper.toDomain(raw);
      const quantityBefore = this.getQuantityByBloodType(stock).getValue();
      stock.adjustBy(command.movement);
      const quantityAfter = this.getQuantityByBloodType(stock).getValue();

      await tx.stock.update({
        where: { id: command.stockId },
        data: {
          quantityA: stock.getQuantityA().getValue(),
          quantityB: stock.getQuantityB().getValue(),
          quantityAB: stock.getQuantityAB().getValue(),
          quantityO: stock.getQuantityO().getValue(),
          updatedAt: command.timestamp,
        },
      });

      await tx.stockMovement.create({
        data: {
          id: command.movementId,
          stockId: command.stockId,
          quantityBefore,
          movement: command.movement,
          quantityAfter,
          actionBy: command.actionBy,
          notes: command.notes,
          createdAt: command.timestamp,
        },
      });

      return {
        stockId: stock.getId().getValue(),
        companyId: stock.getCompanyId().getValue(),
        bloodType: stock.getBloodType().getValue(),
        quantityABefore: raw.quantityA,
        quantityBBefore: raw.quantityB,
        quantityABBefore: raw.quantityAB,
        quantityOBefore: raw.quantityO,
        quantityAAfter: stock.getQuantityA().getValue(),
        quantityBAfter: stock.getQuantityB().getValue(),
        quantityABAfter: stock.getQuantityAB().getValue(),
        quantityOAfter: stock.getQuantityO().getValue(),
        timestamp: command.timestamp,
      };
    });
  }

  async save(stock: StockItem): Promise<void> {
    const raw = this.mapper.toPersistence(stock);

    await this.prisma.stock.upsert({
      where: { id: stock.getId().getValue() },
      update: {
        quantityA: stock.getQuantityA().getValue(),
        quantityB: stock.getQuantityB().getValue(),
        quantityAB: stock.getQuantityAB().getValue(),
        quantityO: stock.getQuantityO().getValue(),
        updatedAt: new Date(),
      },
      create: raw,
    });
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
}
