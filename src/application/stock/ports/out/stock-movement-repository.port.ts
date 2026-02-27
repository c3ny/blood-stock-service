import { StockMovement } from '@domain/entities';

export interface StockMovementRepositoryPort {
  save(movement: StockMovement): Promise<void>;
}

export const STOCK_MOVEMENT_REPOSITORY_PORT = Symbol('STOCK_MOVEMENT_REPOSITORY_PORT');
