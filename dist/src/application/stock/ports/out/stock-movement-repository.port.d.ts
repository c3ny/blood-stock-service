import { StockMovement } from '@domain/entities';
export interface StockMovementRepositoryPort {
    save(movement: StockMovement): Promise<void>;
}
export declare const STOCK_MOVEMENT_REPOSITORY_PORT: unique symbol;
