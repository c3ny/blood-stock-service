import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StockNotFoundError } from '@application/stock/errors';
import { InsufficientStockError } from '@domain/errors';

interface StandardErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  traceId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceId = request.traceId || request.headers['x-trace-id'] || randomUUID();
    response.setHeader('x-trace-id', traceId);

    const { statusCode, code, message, details } = this.normalizeError(exception, request.url);

    const payload: StandardErrorResponse = {
      statusCode,
      code,
      message,
      details,
      traceId,
    };

    response.status(statusCode).json(payload);
  }

  private normalizeError(exception: unknown, path: string): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof StockNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'STOCK_NOT_FOUND',
        message: exception.message,
        details: { path, timestamp: new Date().toISOString() },
      };
    }

    if (exception instanceof InsufficientStockError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INSUFFICIENT_STOCK',
        message: exception.message,
        details: { path, timestamp: new Date().toISOString() },
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse() as string | Record<string, unknown>;

      if (typeof response === 'string') {
        return {
          statusCode,
          code: this.mapHttpStatusToCode(statusCode),
          message: response,
          details: { path, timestamp: new Date().toISOString() },
        };
      }

      const message = Array.isArray(response.message)
        ? 'Validation failed'
        : String(response.message ?? exception.message);

      const details = {
        path,
        timestamp: new Date().toISOString(),
        errors: Array.isArray(response.message) ? response.message : undefined,
      };

      return {
        statusCode,
        code: this.mapHttpStatusToCode(statusCode),
        message,
        details,
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: exception.message,
        details: { path, timestamp: new Date().toISOString() },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      details: { path, timestamp: new Date().toISOString() },
    };
  }

  private mapHttpStatusToCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'HTTP_ERROR';
    }
  }
}
