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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const ports_1 = require("../../../../application/stock/ports");
const use_cases_1 = require("../../../../application/stock/use-cases");
const errors_1 = require("../../../../domain/errors");
const dto_1 = require("./dto");
let StockController = class StockController {
    adjustStockUseCase;
    constructor(adjustStockUseCase) {
        this.adjustStockUseCase = adjustStockUseCase;
    }
    async adjustStock(stockId, dto) {
        try {
            const command = new use_cases_1.AdjustStockCommand(stockId, dto.movement, dto.actionBy, dto.notes);
            const result = await this.adjustStockUseCase.execute(command);
            return {
                stockId: result.stockId,
                companyId: result.companyId,
                bloodType: result.bloodType,
                quantityABefore: result.quantityABefore,
                quantityBBefore: result.quantityBBefore,
                quantityABBefore: result.quantityABBefore,
                quantityOBefore: result.quantityOBefore,
                quantityAAfter: result.quantityAAfter,
                quantityBAfter: result.quantityBAfter,
                quantityABAfter: result.quantityABAfter,
                quantityOAfter: result.quantityOAfter,
                timestamp: result.timestamp,
            };
        }
        catch (error) {
            if (error instanceof errors_1.InsufficientStockError) {
                throw new common_1.BadRequestException(error.message);
            }
            if (error instanceof Error && error.message.includes('Stock not found')) {
                throw new common_1.NotFoundException(error.message);
            }
            if (error instanceof Error) {
                throw new common_1.BadRequestException(error.message);
            }
            throw error;
        }
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Patch)(':stockId/adjust'),
    __param(0, (0, common_1.Param)('stockId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AdjustStockRequestDTO]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "adjustStock", null);
exports.StockController = StockController = __decorate([
    (0, common_1.Controller)('stocks'),
    __param(0, (0, common_1.Inject)(ports_1.ADJUST_STOCK_USE_CASE)),
    __metadata("design:paramtypes", [Object])
], StockController);
//# sourceMappingURL=stock.controller.js.map