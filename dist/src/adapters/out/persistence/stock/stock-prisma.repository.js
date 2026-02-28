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
exports.StockPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../../../application/stock/errors");
const errors_2 = require("../../../../domain/errors");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_prisma_mapper_1 = require("./stock-prisma.mapper");
let StockPrismaRepository = class StockPrismaRepository {
    prisma;
    mapper;
    constructor(prisma, mapper) {
        this.prisma = prisma;
        this.mapper = mapper;
    }
    async findById(id) {
        const raw = await this.prisma.stockView.findUnique({
            where: { id },
        });
        if (!raw)
            return null;
        return this.mapper.toDomain({
            id: raw.id,
            companyId: raw.companyId,
            bloodType: this.prismaToBloodType(raw.bloodType),
            ...this.toQuantities(raw.availableCount, raw.bloodType),
            createdAt: raw.lastUpdated,
            updatedAt: raw.lastUpdated,
        });
    }
    async findReadById(id) {
        const raw = await this.prisma.stockView.findUnique({
            where: { id },
        });
        if (!raw)
            return null;
        return {
            id: raw.id,
            companyId: raw.companyId,
            bloodType: this.prismaToBloodType(raw.bloodType),
            ...this.toQuantities(raw.availableCount, raw.bloodType),
            createdAt: raw.lastUpdated,
            updatedAt: raw.lastUpdated,
        };
    }
    async findMany(query) {
        const where = {};
        if (query.companyId) {
            where.companyId = query.companyId;
        }
        if (query.bloodType) {
            where.bloodType = this.bloodTypeToPrisma(query.bloodType);
        }
        const [items, total] = await Promise.all([
            this.prisma.stockView.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { lastUpdated: 'desc' },
            }),
            this.prisma.stockView.count({ where }),
        ]);
        return {
            items: items.map((raw) => ({
                id: raw.id,
                companyId: raw.companyId,
                bloodType: this.prismaToBloodType(raw.bloodType),
                ...this.toQuantities(raw.availableCount, raw.bloodType),
                createdAt: raw.lastUpdated,
                updatedAt: raw.lastUpdated,
            })),
            total,
            page: query.page,
            limit: query.limit,
        };
    }
    async adjustAtomically(command) {
        return this.prisma.$transaction(async (tx) => {
            const stock = await tx.stockView.findUnique({
                where: { id: command.stockId },
            });
            if (!stock) {
                throw new errors_1.StockNotFoundError(command.stockId);
            }
            const nextAvailableCount = stock.availableCount + command.movement;
            if (nextAvailableCount < 0) {
                throw new errors_2.InsufficientStockError(command.stockId, Math.abs(command.movement), stock.availableCount);
            }
            const nextAvailableVolume = Math.max(0, stock.availableVolume + command.movement * 450);
            await tx.stockView.update({
                where: { id: command.stockId },
                data: {
                    availableCount: nextAvailableCount,
                    availableVolume: nextAvailableVolume,
                    totalVolume: nextAvailableVolume,
                    lastUpdated: command.timestamp,
                },
            });
            const user = await tx.user.findFirst({
                where: { companyId: stock.companyId, isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            if (!user) {
                throw new Error(`No active user found for company ${stock.companyId}`);
            }
            await tx.movement.create({
                data: {
                    id: command.movementId,
                    companyId: stock.companyId,
                    userId: user.id,
                    type: command.movement >= 0 ? 'ENTRY_DONATION' : 'EXIT_TRANSFUSION',
                    bloodType: stock.bloodType,
                    quantity: Math.abs(command.movement),
                    origin: command.actionBy,
                    notes: command.notes,
                    createdAt: command.timestamp,
                },
            });
            return {
                stockId: stock.id,
                companyId: stock.companyId,
                bloodType: this.prismaToBloodType(stock.bloodType),
                ...this.toAdjustResultQuantities(stock.availableCount, nextAvailableCount, stock.bloodType),
                timestamp: command.timestamp,
            };
        });
    }
    async save(stock) {
    }
    prismaToBloodType(prismaType) {
        return prismaType.replace('_POS', '+').replace('_NEG', '-');
    }
    bloodTypeToPrisma(domainType) {
        return domainType.replace('+', '_POS').replace('-', '_NEG');
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
    toQuantities(quantity, bloodType) {
        if (bloodType.startsWith('A_')) {
            return { quantityA: quantity, quantityB: 0, quantityAB: 0, quantityO: 0 };
        }
        if (bloodType.startsWith('B_')) {
            return { quantityA: 0, quantityB: quantity, quantityAB: 0, quantityO: 0 };
        }
        if (bloodType.startsWith('AB_')) {
            return { quantityA: 0, quantityB: 0, quantityAB: quantity, quantityO: 0 };
        }
        return { quantityA: 0, quantityB: 0, quantityAB: 0, quantityO: quantity };
    }
    toAdjustResultQuantities(before, after, bloodType) {
        const beforeQuantities = this.toQuantities(before, bloodType);
        const afterQuantities = this.toQuantities(after, bloodType);
        return {
            quantityABefore: beforeQuantities.quantityA,
            quantityBBefore: beforeQuantities.quantityB,
            quantityABBefore: beforeQuantities.quantityAB,
            quantityOBefore: beforeQuantities.quantityO,
            quantityAAfter: afterQuantities.quantityA,
            quantityBAfter: afterQuantities.quantityB,
            quantityABAfter: afterQuantities.quantityAB,
            quantityOAfter: afterQuantities.quantityO,
        };
    }
};
exports.StockPrismaRepository = StockPrismaRepository;
exports.StockPrismaRepository = StockPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_prisma_mapper_1.StockPrismaMapper])
], StockPrismaRepository);
//# sourceMappingURL=stock-prisma.repository.js.map