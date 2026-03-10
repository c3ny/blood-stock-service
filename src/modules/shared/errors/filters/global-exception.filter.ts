import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IllegalArgumentException } from '../exceptions/illegal-argument.exception';
import { NoSuchElementException } from '../exceptions/no-such-element.exception';
import { InsufficientStockException } from '../../../stock/exceptions/insufficient-stock.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * Converte exceções de domínio e HTTP em respostas padronizadas
   * para manter compatibilidade com o contrato legado.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof IllegalArgumentException) {
      response.status(HttpStatus.BAD_REQUEST).json({
        message: exception.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof InsufficientStockException) {
      response.status(HttpStatus.CONFLICT).json({
        message: exception.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof NoSuchElementException) {
      response.status(HttpStatus.NOT_FOUND).send();
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as
        | string
        | { message?: unknown; [key: string]: unknown };

      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof body === 'object' &&
        body !== null &&
        Array.isArray(body.message)
      ) {
        response.status(status).json(body.message);
        return;
      }

      response.status(status).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
    });
  }
}