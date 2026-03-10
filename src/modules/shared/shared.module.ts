import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './errors/filters/global-exception.filter';
import { RequestContextInterceptor } from './request-context.interceptor';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { RequestContextService } from './request-context.service';

/**
 * Módulo global com infraestrutura transversal:
 * contexto de requisição, logging e tratamento centralizado de exceções.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    RequestContextService,
    RequestContextInterceptor,
    RequestLoggingInterceptor,
  ],
  exports: [RequestContextInterceptor, RequestContextService, RequestLoggingInterceptor],
})
export class SharedModule {}