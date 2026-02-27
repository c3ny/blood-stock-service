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
const ports_1 = require("../../ports");
const _domain_1 = require("../../../../domain");
const errors_1 = require("../../../../domain/errors");
let AdjustStockService = class AdjustStockService {
    stockRepository;
    movementRepository;
    idGenerator;
    dateProvider;
    constructor(stockRepository, movementRepository, idGenerator, dateProvider) {
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
        this.idGenerator = idGenerator;
        this.dateProvider = dateProvider;
    }
    async execute(command) {
        const stock = await this.stockRepository.findById(command.stockId);
        if (!stock) {
            throw new Error(`Stock not found with ID: ${command.stockId}`);
        }
        const quantityBefore = this.getQuantityByBloodType(stock);
        try {
            stock.adjustBy(command.movement);
        }
        catch (error) {
            if (error instanceof errors_1.InsufficientStockError) {
                throw error;
            }
            throw error;
        }
        const quantityAfter = this.getQuantityByBloodType(stock);
        const movement = new _domain_1.StockMovement({
            id: new _domain_1.EntityId(this.idGenerator.generate()),
            stockId: stock.getId(),
            quantityBefore,
            movement: command.movement,
            quantityAfter,
            actionBy: command.actionBy,
            notes: command.notes,
            createdAt: this.dateProvider.now(),
        });
        await this.movementRepository.save(movement);
        await this.stockRepository.save(stock);
        return new ports_1.AdjustStockResult(stock.getId().getValue(), stock.getCompanyId().getValue(), stock.getBloodType().getValue(), quantityBefore.getValue(), quantityBefore.getValue(), quantityBefore.getValue(), quantityBefore.getValue(), quantityAfter.getValue(), quantityAfter.getValue(), quantityAfter.getValue(), quantityAfter.getValue(), this.dateProvider.now());
    }
    getQuantityByBloodType(stock) {
        const type = stock.getBloodType().getValue();
        if (type === 'A+' || type === 'A-')
            return stock.getQuantityA();
        if (type === 'B+' || type === 'B-')
            return stock.getQuantityB();
        if (type === 'AB+' || type === 'AB-')
            return stock.getQuantityAB();
        if (type === 'O+' || type === 'O-')
            return stock.getQuantityO();
        throw new Error(`Unknown blood type: ${type}`);
    }
};
exports.AdjustStockService = AdjustStockService;
exports.AdjustStockService = AdjustStockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ports_1.STOCK_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(ports_1.STOCK_MOVEMENT_REPOSITORY_PORT)),
    __param(2, (0, common_1.Inject)(ports_1.ID_GENERATOR_PORT)),
    __param(3, (0, common_1.Inject)(ports_1.DATE_PROVIDER_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], AdjustStockService);
//# sourceMappingURL=adjust-stock.service.js.map