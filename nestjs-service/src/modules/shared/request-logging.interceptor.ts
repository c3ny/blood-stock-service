import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const data = this.requestContextService.get();
          const response = context.switchToHttp().getResponse();

          this.logger.log({
            requestId: data?.requestId,
            method: data?.method,
            path: data?.path,
            ip: data?.ip,
            statusCode: response?.statusCode,
            durationMs: Date.now() - startedAt,
          });
        },
        error: (error: unknown) => {
          const data = this.requestContextService.get();
          const response = context.switchToHttp().getResponse();

          this.logger.error({
            requestId: data?.requestId,
            method: data?.method,
            path: data?.path,
            ip: data?.ip,
            statusCode: response?.statusCode,
            durationMs: Date.now() - startedAt,
            message: error instanceof Error ? error.message : 'Unhandled error',
          });
        },
      }),
    );
  }
}