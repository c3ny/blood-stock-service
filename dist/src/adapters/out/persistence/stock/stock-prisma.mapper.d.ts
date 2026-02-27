import type { Stock as PrismaStock } from '@prisma/client';
import { StockItem } from '@domain';
export declare class StockPrismaMapper {
    toDomain(raw: PrismaStock): StockItem;
    toPersistence(domain: StockItem): PrismaStock;
    private prismaToBloodType;
    private bloodTypeToPrisma;
}
