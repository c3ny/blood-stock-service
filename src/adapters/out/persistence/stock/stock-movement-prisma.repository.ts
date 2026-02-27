import { Injectable } from '@nestjs/common';
import { StockMovementRepositoryPort } from '@application/stock/ports';
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
}
