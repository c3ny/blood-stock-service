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
        const raw = await this.prisma.stock.findUnique({
            where: { id },
        });
        if (!raw)
            return null;
        return this.mapper.toDomain(raw);
    }
    async findReadById(id) {
        const raw = await this.prisma.stock.findUnique({
            where: { id },
        });
        if (!raw)
            return null;
        return {
            id: raw.id,
            companyId: raw.companyId,
            bloodType: this.prismaToBloodType(raw.bloodType),
            quantityA: raw.quantityA,
            quantityB: raw.quantityB,
            quantityAB: raw.quantityAB,
            quantityO: raw.quantityO,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
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
            this.prisma.stock.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.stock.count({ where }),
        ]);
        return {
            items: items.map((raw) => ({
                id: raw.id,
                companyId: raw.companyId,
                bloodType: this.prismaToBloodType(raw.bloodType),
                quantityA: raw.quantityA,
                quantityB: raw.quantityB,
                quantityAB: raw.quantityAB,
                quantityO: raw.quantityO,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            })),
            total,
            page: query.page,
            limit: query.limit,
        };
    }
    async adjustAtomically(command) {
        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM "stock" WHERE id = ${command.stockId} FOR UPDATE`;
            const raw = await tx.stock.findUnique({
                where: { id: command.stockId },
            });
            if (!raw) {
                throw new errors_1.StockNotFoundError(command.stockId);
            }
            const stock = this.mapper.toDomain(raw);
            const quantityBefore = this.getQuantityByBloodType(stock).getValue();
            stock.adjustBy(command.movement);
            const quantityAfter = this.getQuantityByBloodType(stock).getValue();
            await tx.stock.update({
                where: { id: command.stockId },
                data: {
                    quantityA: stock.getQuantityA().getValue(),
                    quantityB: stock.getQuantityB().getValue(),
                    quantityAB: stock.getQuantityAB().getValue(),
                    quantityO: stock.getQuantityO().getValue(),
                    updatedAt: command.timestamp,
                },
            });
            await tx.stockMovement.create({
                data: {
                    id: command.movementId,
                    stockId: command.stockId,
                    quantityBefore,
                    movement: command.movement,
                    quantityAfter,
                    actionBy: command.actionBy,
                    notes: command.notes,
                    createdAt: command.timestamp,
                },
            });
            return {
                stockId: stock.getId().getValue(),
                companyId: stock.getCompanyId().getValue(),
                bloodType: stock.getBloodType().getValue(),
                quantityABefore: raw.quantityA,
                quantityBBefore: raw.quantityB,
                quantityABBefore: raw.quantityAB,
                quantityOBefore: raw.quantityO,
                quantityAAfter: stock.getQuantityA().getValue(),
                quantityBAfter: stock.getQuantityB().getValue(),
                quantityABAfter: stock.getQuantityAB().getValue(),
                quantityOAfter: stock.getQuantityO().getValue(),
                timestamp: command.timestamp,
            };
        });
    }
    async save(stock) {
        const raw = this.mapper.toPersistence(stock);
        await this.prisma.stock.upsert({
            where: { id: stock.getId().getValue() },
            update: {
                quantityA: stock.getQuantityA().getValue(),
                quantityB: stock.getQuantityB().getValue(),
                quantityAB: stock.getQuantityAB().getValue(),
                quantityO: stock.getQuantityO().getValue(),
                updatedAt: new Date(),
            },
            create: raw,
        });
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
};
exports.StockPrismaRepository = StockPrismaRepository;
exports.StockPrismaRepository = StockPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_prisma_mapper_1.StockPrismaMapper])
], StockPrismaRepository);
//# sourceMappingURL=stock-prisma.repository.js.map