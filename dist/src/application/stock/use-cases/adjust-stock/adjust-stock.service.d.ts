import { AdjustStockUseCase } from '../../ports/in/adjust-stock.use-case';
import { AdjustStockCommand } from './adjust-stock.command';
import { AdjustStockResult } from './adjust-stock.result';
import { StockRepositoryPort } from '../../ports/out/stock-repository.port';
import { IdGeneratorPort } from '../../ports/out/id-generator.port';
import { DateProviderPort } from '../../ports/out/date-provider.port';
export declare class AdjustStockService implements AdjustStockUseCase {
    private readonly stockRepository;
    private readonly idGenerator;
    private readonly dateProvider;
    constructor(stockRepository: StockRepositoryPort, idGenerator: IdGeneratorPort, dateProvider: DateProviderPort);
    execute(command: AdjustStockCommand): Promise<AdjustStockResult>;
}
