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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StockMovementPrismaRepository = class StockMovementPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(movement) {
        await this.prisma.stockMovement.create({
            data: {
                id: movement.getId().getValue(),
                stockId: movement.getStockId().getValue(),
                quantityBefore: movement.getQuantityBefore().getValue(),
                movement: movement.getMovement(),
                quantityAfter: movement.getQuantityAfter().getValue(),
                actionBy: movement.getActionBy(),
                notes: movement.getNotes(),
            },
        });
    }
};
exports.StockMovementPrismaRepository = StockMovementPrismaRepository;
exports.StockMovementPrismaRepository = StockMovementPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementPrismaRepository);
//# sourceMappingURL=stock-movement-prisma.repository.js.map