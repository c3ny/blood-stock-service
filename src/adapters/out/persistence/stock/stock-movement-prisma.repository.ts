import { Injectable } from '@nestjs/common';
import { StockMovementListResult, StockMovementRepositoryPort } from '@application/stock/ports';
import { StockMovement } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockMovementPrismaRepository implements StockMovementRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(movement: StockMovement): Promise<void> {
    const stockId = movement.getStockId()?.getValue();
    if (!stockId) {
      return;
    }

    const stock = await this.prisma.stockView.findUnique({ where: { id: stockId } });
    if (!stock) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: { companyId: stock.companyId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      return;
    }

    const movementValue = movement.getMovement();
    const movementType = movementValue >= 0 ? 'ENTRY_DONATION' : 'EXIT_TRANSFUSION';

    await this.prisma.movement.create({
      data: {
        id: movement.getId().getValue(),
        companyId: stock.companyId,
        userId: user.id,
        type: movementType as any,
        bloodType: stock.bloodType,
        quantity: Math.abs(movementValue),
        notes: movement.getNotes(),
      },
    });
  }

  async findByStockId(stockId: string, limit?: number): Promise<StockMovementListResult> {
    const stock = await this.prisma.stockView.findUnique({ where: { id: stockId } });
    if (!stock) {
      return { items: [], total: 0 };
    }

    const items = await this.prisma.movement.findMany({
      where: {
        companyId: stock.companyId,
        bloodType: stock.bloodType,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.movement.count({
      where: {
        companyId: stock.companyId,
        bloodType: stock.bloodType,
      },
    });

    return {
      items: items.map((item: any) => ({
        id: item.id,
        stockId,
        movement: this.typeToMovement(item.type, item.quantity),
        quantityBefore: 0,
        quantityAfter: Math.abs(item.quantity),
        actionBy: item.userId,
        notes: item.notes,
        createdAt: item.createdAt,
      })),
      total,
    };
  }

  private typeToMovement(type: string, quantity: number): number {
    if (typeof type === 'string' && type.startsWith('EXIT_')) {
      return -Math.abs(quantity);
    }

    return Math.abs(quantity);
  }
}
