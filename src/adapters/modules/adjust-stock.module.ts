import { Module } from '@nestjs/common';
import { ADJUST_STOCK_USE_CASE } from '@application/stock/ports';
import { AdjustStockService } from '@application/stock/use-cases';
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
        movementRepository: StockMovementPrismaRepository,
        idGenerator: UuidIdGeneratorAdapter,
        dateProvider: SystemDateProviderAdapter,
      ) => {
        return new AdjustStockService(
          stockRepository,
          movementRepository,
          idGenerator,
          dateProvider,
        );
      },
      inject: [
        StockPrismaRepository,
        StockMovementPrismaRepository,
        UuidIdGeneratorAdapter,
        SystemDateProviderAdapter,
      ],
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
  exports: [ADJUST_STOCK_USE_CASE],
})
export class AdjustStockModule {}
