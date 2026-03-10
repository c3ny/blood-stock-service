/**
 * Exceção lançada quando uma movimentação deixaria o estoque negativo.
 */
export class InsufficientStockException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockException';
  }
}