import { ListStocksQuery, ListStocksResult } from '@application/stock/ports';
export interface ListStocksUseCase {
    execute(query: ListStocksQuery): Promise<ListStocksResult>;
}
export declare const LIST_STOCKS_USE_CASE: unique symbol;
