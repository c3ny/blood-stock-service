import { AdjustStockUseCase, AdjustStockCommand, AdjustStockResult, StockRepositoryPort, StockMovementRepositoryPort, IdGeneratorPort, DateProviderPort } from '../../ports';
export declare class AdjustStockService implements AdjustStockUseCase {
    private readonly stockRepository;
    private readonly movementRepository;
    private readonly idGenerator;
    private readonly dateProvider;
    constructor(stockRepository: StockRepositoryPort, movementRepository: StockMovementRepositoryPort, idGenerator: IdGeneratorPort, dateProvider: DateProviderPort);
    execute(command: AdjustStockCommand): Promise<AdjustStockResult>;
    private getQuantityByBloodType;
}
