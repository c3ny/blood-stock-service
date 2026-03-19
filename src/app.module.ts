import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchModule } from './modules/batch/batch.module';
import { CompanyModule } from './modules/company/company.module';
import { SharedModule } from './modules/shared/shared.module';
import { StockModule } from './modules/stock/stock.module';
import { AppDataSource } from './database/typeorm.config';

/**
 * Módulo raiz responsável por compor os módulos de domínio,
 * configuração global e conexão principal com o banco.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRoot({
      ...AppDataSource,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    SharedModule,
    CompanyModule,
    BatchModule,
    StockModule,
  ],
})
export class AppModule {}