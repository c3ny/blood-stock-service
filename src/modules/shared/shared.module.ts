import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './errors/filters/global-exception.filter';
import { RequestContextInterceptor } from './request-context.interceptor';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { AppLoggerService } from '../../shared/logger/app-logger.service';
import { HttpLoggingInterceptor } from '../../shared/interceptors/http-logging.interceptor';
import { AllExceptionsFilter } from '../../shared/filters/all-exceptions.filter';
import { RequestContextService } from './request-context.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { InternalSecretGuard } from './auth/internal-secret.guard';
import { RequireCompanyGuard } from './auth/require-company.guard';

@Global()
@Module({
  imports: [PassportModule],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    InternalSecretGuard,
    RequireCompanyGuard,
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
    {
      provide: AppLoggerService,
      useFactory: () => new AppLoggerService('blood-stock-service'),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    RequestContextService,
    RequestContextInterceptor,
    RequestLoggingInterceptor,
  ],
  exports: [
    JwtAuthGuard,
    InternalSecretGuard,
    RequireCompanyGuard,
    RequestContextInterceptor,
    RequestContextService,
    RequestLoggingInterceptor,
    AppLoggerService,
  ],
})
export class SharedModule {}