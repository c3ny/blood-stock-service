import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchModule } from './modules/batch/batch.module';
import { CompanyModule } from './modules/company/company.module';
import { SharedModule } from './modules/shared/shared.module';
import { StockModule } from './modules/stock/stock.module';
import { appDataSourceOptions } from './database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRoot({
      ...appDataSourceOptions,
      autoLoadEntities: true,
    }),
    SharedModule,
    CompanyModule,
    BatchModule,
    StockModule,
  ],
})
export class AppModule {}