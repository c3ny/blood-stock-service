import { StockReadModel, StockRepositoryPort } from '@application/stock/ports';
import { GetStockByIdUseCase } from '@application/stock/ports/in';
export declare class GetStockByIdService implements GetStockByIdUseCase {
    private readonly stockRepository;
    constructor(stockRepository: StockRepositoryPort);
    execute(stockId: string): Promise<StockReadModel>;
}
