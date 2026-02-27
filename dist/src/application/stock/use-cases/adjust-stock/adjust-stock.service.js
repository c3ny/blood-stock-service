"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockService = void 0;
const common_1 = require("@nestjs/common");
const adjust_stock_result_1 = require("./adjust-stock.result");
const stock_repository_port_1 = require("../../ports/out/stock-repository.port");
const id_generator_port_1 = require("../../ports/out/id-generator.port");
const date_provider_port_1 = require("../../ports/out/date-provider.port");
let AdjustStockService = class AdjustStockService {
    stockRepository;
    idGenerator;
    dateProvider;
    constructor(stockRepository, idGenerator, dateProvider) {
        this.stockRepository = stockRepository;
        this.idGenerator = idGenerator;
        this.dateProvider = dateProvider;
    }
    async execute(command) {
        const timestamp = this.dateProvider.now();
        const adjustment = await this.stockRepository.adjustAtomically({
            stockId: command.stockId,
            movementId: this.idGenerator.generate(),
            movement: command.movement,
            actionBy: command.actionBy,
            notes: command.notes,
            timestamp,
        });
        return new adjust_stock_result_1.AdjustStockResult(adjustment.stockId, adjustment.companyId, adjustment.bloodType, adjustment.quantityABefore, adjustment.quantityBBefore, adjustment.quantityABBefore, adjustment.quantityOBefore, adjustment.quantityAAfter, adjustment.quantityBAfter, adjustment.quantityABAfter, adjustment.quantityOAfter, adjustment.timestamp);
    }
};
exports.AdjustStockService = AdjustStockService;
exports.AdjustStockService = AdjustStockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(stock_repository_port_1.STOCK_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(id_generator_port_1.ID_GENERATOR_PORT)),
    __param(2, (0, common_1.Inject)(date_provider_port_1.DATE_PROVIDER_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object])
], AdjustStockService);
//# sourceMappingURL=adjust-stock.service.js.map