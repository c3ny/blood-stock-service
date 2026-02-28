import { StockItem } from '@domain';
export declare class StockPrismaMapper {
    toDomain(raw: any): StockItem;
    toPersistence(domain: StockItem): any;
    private prismaToBloodType;
    private bloodTypeToPrisma;
}
