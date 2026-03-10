import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const requestIdHeader = request.headers['x-request-id'];
    const requestId =
      typeof requestIdHeader === 'string' && requestIdHeader.trim().length > 0
        ? requestIdHeader
        : randomUUID();
    const method = request.method;
    const path = request.originalUrl ?? request.url;
    const ip = request.ip ?? '';

    response.setHeader('X-Request-Id', requestId);
    response.setHeader('X-Request-Method', method);
    response.setHeader('X-Request-Path', path);

    return new Observable((subscriber) => {
      this.requestContextService.run(
        {
          requestId,
          method,
          path,
          ip,
        },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }
}