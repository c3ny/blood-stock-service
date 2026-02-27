import { StockItem } from '@domain/entities';
export interface StockReadModel {
    id: string;
    companyId: string;
    bloodType: string;
    quantityA: number;
    quantityB: number;
    quantityAB: number;
    quantityO: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ListStocksQuery {
    companyId?: string;
    bloodType?: string;
    page: number;
    limit: number;
}
export interface ListStocksResult {
    items: StockReadModel[];
    total: number;
    page: number;
    limit: number;
}
export interface AtomicAdjustStockCommand {
    stockId: string;
    movementId: string;
    movement: number;
    actionBy: string;
    notes: string;
    timestamp: Date;
}
export interface AtomicAdjustStockResult {
    stockId: string;
    companyId: string;
    bloodType: string;
    quantityABefore: number;
    quantityBBefore: number;
    quantityABBefore: number;
    quantityOBefore: number;
    quantityAAfter: number;
    quantityBAfter: number;
    quantityABAfter: number;
    quantityOAfter: number;
    timestamp: Date;
}
export interface StockRepositoryPort {
    findById(id: string): Promise<StockItem | null>;
    findReadById(id: string): Promise<StockReadModel | null>;
    findMany(query: ListStocksQuery): Promise<ListStocksResult>;
    adjustAtomically(command: AtomicAdjustStockCommand): Promise<AtomicAdjustStockResult>;
    save(stock: StockItem): Promise<void>;
}
export declare const STOCK_REPOSITORY_PORT: unique symbol;
