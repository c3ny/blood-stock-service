import { StockRepositoryPort } from '@application/stock/ports';
import { StockItem } from '@domain';
import { PrismaService } from '../prisma/prisma.service';
import { StockPrismaMapper } from './stock-prisma.mapper';
export declare class StockPrismaRepository implements StockRepositoryPort {
    private readonly prisma;
    private readonly mapper;
    constructor(prisma: PrismaService, mapper: StockPrismaMapper);
    findById(id: string): Promise<StockItem | null>;
    save(stock: StockItem): Promise<void>;
}
