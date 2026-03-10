export class InsufficientStockException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockException';
  }
}