import { AtomicAdjustStockCommand, AtomicAdjustStockResult, ListStocksQuery, ListStocksResult, StockReadModel, StockRepositoryPort } from '@application/stock/ports';
import { StockItem } from '@domain';
import { PrismaService } from '../prisma/prisma.service';
import { StockPrismaMapper } from './stock-prisma.mapper';
export declare class StockPrismaRepository implements StockRepositoryPort {
    private readonly prisma;
    private readonly mapper;
    constructor(prisma: PrismaService, mapper: StockPrismaMapper);
    findById(id: string): Promise<StockItem | null>;
    findReadById(id: string): Promise<StockReadModel | null>;
    findMany(query: ListStocksQuery): Promise<ListStocksResult>;
    adjustAtomically(command: AtomicAdjustStockCommand): Promise<AtomicAdjustStockResult>;
    save(stock: StockItem): Promise<void>;
    private prismaToBloodType;
    private bloodTypeToPrisma;
    private getQuantityByBloodType;
}
