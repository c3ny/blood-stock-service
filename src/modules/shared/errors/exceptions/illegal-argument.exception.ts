/**
 * Exceção de domínio para entradas inválidas nas regras de negócio.
 */
export class IllegalArgumentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalArgumentException';
  }
}