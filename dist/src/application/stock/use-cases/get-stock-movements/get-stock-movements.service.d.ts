import { StockMovementListResult, StockMovementRepositoryPort, StockRepositoryPort } from '@application/stock/ports';
import { GetStockMovementsUseCase } from '@application/stock/ports/in';
export declare class GetStockMovementsService implements GetStockMovementsUseCase {
    private readonly stockRepository;
    private readonly stockMovementRepository;
    constructor(stockRepository: StockRepositoryPort, stockMovementRepository: StockMovementRepositoryPort);
    execute(stockId: string, limit: number): Promise<StockMovementListResult>;
}
