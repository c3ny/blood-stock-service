import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './errors/filters/global-exception.filter';
import { RequestContextInterceptor } from './request-context.interceptor';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { RequestContextService } from './request-context.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Global()
@Module({
  imports: [PassportModule],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
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
  exports: [
    JwtAuthGuard,
    RequestContextInterceptor,
    RequestContextService,
    RequestLoggingInterceptor,
  ],
})
export class SharedModule {}