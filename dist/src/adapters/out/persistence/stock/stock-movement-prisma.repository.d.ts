import { StockMovementListResult, StockMovementRepositoryPort } from '@application/stock/ports';
import { StockMovement } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';
export declare class StockMovementPrismaRepository implements StockMovementRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(movement: StockMovement): Promise<void>;
    findByStockId(stockId: string, limit?: number): Promise<StockMovementListResult>;
}
