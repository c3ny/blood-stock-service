import { StockMovementListResult } from '@application/stock/ports';

export interface GetStockMovementsUseCase {
  execute(stockId: string, limit: number): Promise<StockMovementListResult>;
}

export const GET_STOCK_MOVEMENTS_USE_CASE = Symbol('GET_STOCK_MOVEMENTS_USE_CASE');
