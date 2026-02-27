import { StockItem } from '@domain/entities';

export interface StockRepositoryPort {
  findById(id: string): Promise<StockItem | null>;
  save(stock: StockItem): Promise<void>;
}

export const STOCK_REPOSITORY_PORT = Symbol('STOCK_REPOSITORY_PORT');
