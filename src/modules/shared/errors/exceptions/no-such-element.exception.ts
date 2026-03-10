/**
 * Exceção de domínio para cenários em que um recurso esperado não existe.
 */
export class NoSuchElementException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSuchElementException';
  }
}