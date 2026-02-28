import { Inject, Injectable } from '@nestjs/common';
import { ListStocksQuery, ListStocksResult, STOCK_REPOSITORY_PORT, StockRepositoryPort } from '@application/stock/ports';
import { ListStocksUseCase } from '@application/stock/ports/in';

@Injectable()
export class ListStocksService implements ListStocksUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(query: ListStocksQuery): Promise<ListStocksResult> {
    return this.stockRepository.findMany(query);
  }
}
