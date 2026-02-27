export class StockNotFoundError extends Error {
  constructor(stockId: string) {
    super(`Stock not found with ID: ${stockId}`);
    this.name = 'StockNotFoundError';
  }
}
