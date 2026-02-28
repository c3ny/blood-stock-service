import { ListStocksQuery, ListStocksResult } from '@application/stock/ports';

export interface ListStocksUseCase {
  execute(query: ListStocksQuery): Promise<ListStocksResult>;
}

export const LIST_STOCKS_USE_CASE = Symbol('LIST_STOCKS_USE_CASE');
