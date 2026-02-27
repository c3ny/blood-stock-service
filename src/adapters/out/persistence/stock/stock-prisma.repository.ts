import { Injectable } from '@nestjs/common';
import { StockRepositoryPort } from '@application/stock/ports';
import { StockItem } from '@domain';
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
}
