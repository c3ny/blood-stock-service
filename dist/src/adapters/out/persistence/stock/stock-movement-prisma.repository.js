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
        const stockId = movement.getStockId()?.getValue();
        if (!stockId) {
            return;
        }
        const stock = await this.prisma.stockView.findUnique({ where: { id: stockId } });
        if (!stock) {
            return;
        }
        const user = await this.prisma.user.findFirst({
            where: { companyId: stock.companyId, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!user) {
            return;
        }
        const movementValue = movement.getMovement();
        const movementType = movementValue >= 0 ? 'ENTRY_DONATION' : 'EXIT_TRANSFUSION';
        await this.prisma.movement.create({
            data: {
                id: movement.getId().getValue(),
                companyId: stock.companyId,
                userId: user.id,
                type: movementType,
                bloodType: stock.bloodType,
                quantity: Math.abs(movementValue),
                notes: movement.getNotes(),
            },
        });
    }
    async findByStockId(stockId, limit) {
        const stock = await this.prisma.stockView.findUnique({ where: { id: stockId } });
        if (!stock) {
            return { items: [], total: 0 };
        }
        const items = await this.prisma.movement.findMany({
            where: {
                companyId: stock.companyId,
                bloodType: stock.bloodType,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        const total = await this.prisma.movement.count({
            where: {
                companyId: stock.companyId,
                bloodType: stock.bloodType,
            },
        });
        return {
            items: items.map((item) => ({
                id: item.id,
                stockId,
                movement: this.typeToMovement(item.type, item.quantity),
                quantityBefore: 0,
                quantityAfter: Math.abs(item.quantity),
                actionBy: item.userId,
                notes: item.notes,
                createdAt: item.createdAt,
            })),
            total,
        };
    }
    typeToMovement(type, quantity) {
        if (typeof type === 'string' && type.startsWith('EXIT_')) {
            return -Math.abs(quantity);
        }
        return Math.abs(quantity);
    }
};
exports.StockMovementPrismaRepository = StockMovementPrismaRepository;
exports.StockMovementPrismaRepository = StockMovementPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementPrismaRepository);
//# sourceMappingURL=stock-movement-prisma.repository.js.map