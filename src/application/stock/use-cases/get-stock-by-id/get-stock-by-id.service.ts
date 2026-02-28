import { Inject, Injectable } from '@nestjs/common';
import { STOCK_REPOSITORY_PORT, StockReadModel, StockRepositoryPort } from '@application/stock/ports';
import { GetStockByIdUseCase } from '@application/stock/ports/in';
import { StockNotFoundError } from '@application/stock/errors';

@Injectable()
export class GetStockByIdService implements GetStockByIdUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(stockId: string): Promise<StockReadModel> {
    const stock = await this.stockRepository.findReadById(stockId);
    if (!stock) {
      throw new StockNotFoundError(stockId);
    }

    return stock;
  }
}
