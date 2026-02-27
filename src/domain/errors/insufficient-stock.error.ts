export class InsufficientStockError extends Error {
  constructor(stockId: string, requiredQuantity: number, availableQuantity: number) {
    super(
      `Insufficient stock. Stock ID: ${stockId}, Required: ${requiredQuantity}, Available: ${availableQuantity}`,
    );
    this.name = 'InsufficientStockError';
  }
}
