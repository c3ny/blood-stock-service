import { Injectable } from '@nestjs/common';
import { ListStocksQuery, ListStocksResult, StockReadModel, StockRepositoryPort } from '@application/stock/ports';
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
}
