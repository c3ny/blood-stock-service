"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockModule = void 0;
const common_1 = require("@nestjs/common");
const ports_1 = require("../../application/stock/ports");
const use_cases_1 = require("../../application/stock/use-cases");
const prisma_service_1 = require("../out/persistence/prisma/prisma.service");
const stock_prisma_repository_1 = require("../out/persistence/stock/stock-prisma.repository");
const stock_prisma_mapper_1 = require("../out/persistence/stock/stock-prisma.mapper");
const stock_movement_prisma_repository_1 = require("../out/persistence/stock/stock-movement-prisma.repository");
const uuid_id_generator_adapter_1 = require("../out/system/uuid-id-generator.adapter");
const system_date_provider_adapter_1 = require("../out/system/system-date-provider.adapter");
const stock_controller_1 = require("../in/web/stock/stock.controller");
const ports_2 = require("../../application/stock/ports");
let AdjustStockModule = class AdjustStockModule {
};
exports.AdjustStockModule = AdjustStockModule;
exports.AdjustStockModule = AdjustStockModule = __decorate([
    (0, common_1.Module)({
        controllers: [stock_controller_1.StockController],
        providers: [
            prisma_service_1.PrismaService,
            stock_prisma_mapper_1.StockPrismaMapper,
            stock_prisma_repository_1.StockPrismaRepository,
            stock_movement_prisma_repository_1.StockMovementPrismaRepository,
            uuid_id_generator_adapter_1.UuidIdGeneratorAdapter,
            system_date_provider_adapter_1.SystemDateProviderAdapter,
            {
                provide: ports_1.ADJUST_STOCK_USE_CASE,
                useFactory: (stockRepository, idGenerator, dateProvider) => {
                    return new use_cases_1.AdjustStockUseCaseHandler(stockRepository, idGenerator, dateProvider);
                },
                inject: [
                    stock_prisma_repository_1.StockPrismaRepository,
                    uuid_id_generator_adapter_1.UuidIdGeneratorAdapter,
                    system_date_provider_adapter_1.SystemDateProviderAdapter,
                ],
            },
            {
                provide: ports_2.STOCK_REPOSITORY_PORT,
                useClass: stock_prisma_repository_1.StockPrismaRepository,
            },
            {
                provide: ports_2.STOCK_MOVEMENT_REPOSITORY_PORT,
                useClass: stock_movement_prisma_repository_1.StockMovementPrismaRepository,
            },
            {
                provide: ports_2.ID_GENERATOR_PORT,
                useClass: uuid_id_generator_adapter_1.UuidIdGeneratorAdapter,
            },
            {
                provide: ports_2.DATE_PROVIDER_PORT,
                useClass: system_date_provider_adapter_1.SystemDateProviderAdapter,
            },
        ],
        exports: [ports_1.ADJUST_STOCK_USE_CASE],
    })
], AdjustStockModule);
//# sourceMappingURL=adjust-stock.module.js.map