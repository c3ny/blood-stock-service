import { Module } from '@nestjs/common';
import {
  ADJUST_STOCK_USE_CASE,
  GET_STOCK_BY_ID_USE_CASE,
  GET_STOCK_MOVEMENTS_USE_CASE,
  LIST_STOCKS_USE_CASE,
} from '@application/stock/ports';
import {
  AdjustStockService,
  GetStockByIdService,
  GetStockMovementsService,
  ListStocksService,
} from '@application/stock/use-cases';
import { PrismaService } from '../out/persistence/prisma/prisma.service';
import { StockPrismaRepository } from '../out/persistence/stock/stock-prisma.repository';
import { StockPrismaMapper } from '../out/persistence/stock/stock-prisma.mapper';
import { StockMovementPrismaRepository } from '../out/persistence/stock/stock-movement-prisma.repository';
import { UuidIdGeneratorAdapter } from '../out/system/uuid-id-generator.adapter';
import { SystemDateProviderAdapter } from '../out/system/system-date-provider.adapter';
import { StockController } from '../in/web/stock/stock.controller';
import {
  STOCK_REPOSITORY_PORT,
  STOCK_MOVEMENT_REPOSITORY_PORT,
  ID_GENERATOR_PORT,
  DATE_PROVIDER_PORT,
} from '@application/stock/ports';

@Module({
  controllers: [StockController],
  providers: [
    PrismaService,
    StockPrismaMapper,
    StockPrismaRepository,
    StockMovementPrismaRepository,
    UuidIdGeneratorAdapter,
    SystemDateProviderAdapter,
    {
      provide: ADJUST_STOCK_USE_CASE,
      useFactory: (
        stockRepository: StockPrismaRepository,
        idGenerator: UuidIdGeneratorAdapter,
        dateProvider: SystemDateProviderAdapter,
      ) => {
        return new AdjustStockService(
          stockRepository,
          idGenerator,
          dateProvider,
        );
      },
      inject: [
        StockPrismaRepository,
        UuidIdGeneratorAdapter,
        SystemDateProviderAdapter,
      ],
    },
    {
      provide: LIST_STOCKS_USE_CASE,
      useClass: ListStocksService,
    },
    {
      provide: GET_STOCK_BY_ID_USE_CASE,
      useClass: GetStockByIdService,
    },
    {
      provide: GET_STOCK_MOVEMENTS_USE_CASE,
      useClass: GetStockMovementsService,
    },
    {
      provide: STOCK_REPOSITORY_PORT,
      useClass: StockPrismaRepository,
    },
    {
      provide: STOCK_MOVEMENT_REPOSITORY_PORT,
      useClass: StockMovementPrismaRepository,
    },
    {
      provide: ID_GENERATOR_PORT,
      useClass: UuidIdGeneratorAdapter,
    },
    {
      provide: DATE_PROVIDER_PORT,
      useClass: SystemDateProviderAdapter,
    },
  ],
  exports: [
    PrismaService,
    ADJUST_STOCK_USE_CASE,
    LIST_STOCKS_USE_CASE,
    GET_STOCK_BY_ID_USE_CASE,
    GET_STOCK_MOVEMENTS_USE_CASE,
  ],
})
export class AdjustStockModule {}
