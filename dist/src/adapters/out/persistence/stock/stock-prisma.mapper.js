"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockPrismaMapper = void 0;
const common_1 = require("@nestjs/common");
const _domain_1 = require("../../../../domain");
let StockPrismaMapper = class StockPrismaMapper {
    toDomain(raw) {
        return _domain_1.StockItem.create(new _domain_1.EntityId(raw.id), new _domain_1.EntityId(raw.companyId), _domain_1.BloodType.fromString(raw.bloodType), new _domain_1.Quantity(raw.quantityA), new _domain_1.Quantity(raw.quantityB), new _domain_1.Quantity(raw.quantityAB), new _domain_1.Quantity(raw.quantityO));
    }
    toPersistence(domain) {
        return {
            id: domain.getId().getValue(),
            companyId: domain.getCompanyId().getValue(),
            bloodType: domain.getBloodType().getValue(),
            quantityA: domain.getQuantityA().getValue(),
            quantityB: domain.getQuantityB().getValue(),
            quantityAB: domain.getQuantityAB().getValue(),
            quantityO: domain.getQuantityO().getValue(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
};
exports.StockPrismaMapper = StockPrismaMapper;
exports.StockPrismaMapper = StockPrismaMapper = __decorate([
    (0, common_1.Injectable)()
], StockPrismaMapper);
//# sourceMappingURL=stock-prisma.mapper.js.map