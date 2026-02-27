import { Inject, Injectable } from '@nestjs/common';
import {
  STOCK_MOVEMENT_REPOSITORY_PORT,
  STOCK_REPOSITORY_PORT,
  StockMovementListResult,
  StockMovementRepositoryPort,
  StockRepositoryPort,
} from '@application/stock/ports';
import { GetStockMovementsUseCase } from '@application/stock/ports/in';
import { StockNotFoundError } from '@application/stock/errors';

@Injectable()
export class GetStockMovementsService implements GetStockMovementsUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_MOVEMENT_REPOSITORY_PORT)
    private readonly stockMovementRepository: StockMovementRepositoryPort,
  ) {}

  async execute(stockId: string, limit: number): Promise<StockMovementListResult> {
    const stock = await this.stockRepository.findReadById(stockId);
    if (!stock) {
      throw new StockNotFoundError(stockId);
    }

    return this.stockMovementRepository.findByStockId(stockId, limit);
  }
}
