import { ListStocksQuery, ListStocksResult, StockRepositoryPort } from '@application/stock/ports';
import { ListStocksUseCase } from '@application/stock/ports/in';
export declare class ListStocksService implements ListStocksUseCase {
    private readonly stockRepository;
    constructor(stockRepository: StockRepositoryPort);
    execute(query: ListStocksQuery): Promise<ListStocksResult>;
}
