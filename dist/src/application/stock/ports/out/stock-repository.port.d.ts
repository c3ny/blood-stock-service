import { StockItem } from '@domain/entities';
export interface StockRepositoryPort {
    findById(id: string): Promise<StockItem | null>;
    save(stock: StockItem): Promise<void>;
}
export declare const STOCK_REPOSITORY_PORT: unique symbol;
