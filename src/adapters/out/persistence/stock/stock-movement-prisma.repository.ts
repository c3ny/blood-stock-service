import { Injectable } from '@nestjs/common';
import { StockMovementListResult, StockMovementRepositoryPort } from '@application/stock/ports';
import { StockMovement } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockMovementPrismaRepository implements StockMovementRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(movement: StockMovement): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        id: movement.getId().getValue(),
        stockId: movement.getStockId().getValue(),
        quantityBefore: movement.getQuantityBefore().getValue(),
        movement: movement.getMovement(),
        quantityAfter: movement.getQuantityAfter().getValue(),
        actionBy: movement.getActionBy(),
        notes: movement.getNotes(),
      },
    });
  }

  async findByStockId(stockId: string, limit?: number): Promise<StockMovementListResult> {
    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { stockId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({
        where: { stockId },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        stockId: item.stockId,
        movement: item.movement,
        quantityBefore: item.quantityBefore,
        quantityAfter: item.quantityAfter,
        actionBy: item.actionBy,
        notes: item.notes,
        createdAt: item.createdAt,
      })),
      total,
    };
  }
}
