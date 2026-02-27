import { Inject, Injectable } from '@nestjs/common';
import { AdjustStockUseCase, ADJUST_STOCK_USE_CASE } from '../../ports/in/adjust-stock.use-case';
import { AdjustStockCommand } from './adjust-stock.command';
import { AdjustStockResult } from './adjust-stock.result';
import { StockRepositoryPort, STOCK_REPOSITORY_PORT } from '../../ports/out/stock-repository.port';
import { IdGeneratorPort, ID_GENERATOR_PORT } from '../../ports/out/id-generator.port';
import { DateProviderPort, DATE_PROVIDER_PORT } from '../../ports/out/date-provider.port';

@Injectable()
export class AdjustStockService implements AdjustStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
    @Inject(DATE_PROVIDER_PORT)
    private readonly dateProvider: DateProviderPort,
  ) {}

  async execute(command: AdjustStockCommand): Promise<AdjustStockResult> {
    const timestamp = this.dateProvider.now();
    const adjustment = await this.stockRepository.adjustAtomically({
      stockId: command.stockId,
      movementId: this.idGenerator.generate(),
      movement: command.movement,
      actionBy: command.actionBy,
      notes: command.notes,
      timestamp,
    });

    return new AdjustStockResult(
      adjustment.stockId,
      adjustment.companyId,
      adjustment.bloodType,
      adjustment.quantityABefore,
      adjustment.quantityBBefore,
      adjustment.quantityABBefore,
      adjustment.quantityOBefore,
      adjustment.quantityAAfter,
      adjustment.quantityBAfter,
      adjustment.quantityABAfter,
      adjustment.quantityOAfter,
      adjustment.timestamp,
    );
  }
}
