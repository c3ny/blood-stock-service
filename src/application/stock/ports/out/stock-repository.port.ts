import { StockItem } from '@domain/entities';

export interface StockReadModel {
  id: string;
  companyId: string;
  bloodType: string;
  quantityA: number;
  quantityB: number;
  quantityAB: number;
  quantityO: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListStocksQuery {
  companyId?: string;
  bloodType?: string;
  page: number;
  limit: number;
}

export interface ListStocksResult {
  items: StockReadModel[];
  total: number;
  page: number;
  limit: number;
}

export interface StockRepositoryPort {
  findById(id: string): Promise<StockItem | null>;
  findReadById(id: string): Promise<StockReadModel | null>;
  findMany(query: ListStocksQuery): Promise<ListStocksResult>;
  save(stock: StockItem): Promise<void>;
}

export const STOCK_REPOSITORY_PORT = Symbol('STOCK_REPOSITORY_PORT');
