import { Module } from '@nestjs/common';
import {
  ADJUST_STOCK_USE_CASE,
  GET_STOCK_BY_ID_USE_CASE,
  GET_STOCK_MOVEMENTS_USE_CASE,
  LIST_STOCKS_USE_CASE,
} from '@application/stock/ports';
import {
  AdjustStockUseCaseHandler,
  GetStockByIdService,
  GetStockMovementsService,
  ListStocksService,
} from '@application/stock/use-cases';
import {
  DATE_PROVIDER_PORT,
  ID_GENERATOR_PORT,
  STOCK_MOVEMENT_REPOSITORY_PORT,
  STOCK_REPOSITORY_PORT,
} from '@application/stock/ports';
import { StockController } from '@adapters/in/web/stock/stock.controller';
import { PrismaService } from '@adapters/out/persistence/prisma/prisma.service';
import { StockMovementPrismaRepository } from '@adapters/out/persistence/stock/stock-movement-prisma.repository';
import { StockPrismaMapper } from '@adapters/out/persistence/stock/stock-prisma.mapper';
import { StockPrismaRepository } from '@adapters/out/persistence/stock/stock-prisma.repository';
import { SystemDateProviderAdapter } from '@adapters/out/system/system-date-provider.adapter';
import { UuidIdGeneratorAdapter } from '@adapters/out/system/uuid-id-generator.adapter';

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
        return new AdjustStockUseCaseHandler(stockRepository, idGenerator, dateProvider);
      },
      inject: [StockPrismaRepository, UuidIdGeneratorAdapter, SystemDateProviderAdapter],
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
export class StockModule {}
