import { StockReadModel } from '@application/stock/ports';
export interface GetStockByIdUseCase {
    execute(stockId: string): Promise<StockReadModel>;
}
export declare const GET_STOCK_BY_ID_USE_CASE: unique symbol;
