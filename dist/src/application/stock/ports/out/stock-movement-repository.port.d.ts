import { StockMovement } from '@domain/entities';
export interface StockMovementReadModel {
    id: string;
    stockId: string;
    movement: number;
    quantityBefore: number;
    quantityAfter: number;
    actionBy: string;
    notes: string;
    createdAt: Date;
}
export interface StockMovementListResult {
    items: StockMovementReadModel[];
    total: number;
}
export interface StockMovementRepositoryPort {
    save(movement: StockMovement): Promise<void>;
    findByStockId(stockId: string, limit?: number): Promise<StockMovementListResult>;
}
export declare const STOCK_MOVEMENT_REPOSITORY_PORT: unique symbol;
