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
exports.StockListQueryDTO = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
class StockListQueryDTO {
    companyId;
    bloodType;
    page;
    limit;
}
exports.StockListQueryDTO = StockListQueryDTO;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrar por ID da empresa/hospital',
        format: 'uuid',
        example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StockListQueryDTO.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrar por tipo sanguíneo',
        enum: BLOOD_TYPES,
        example: 'O+',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...BLOOD_TYPES]),
    __metadata("design:type", String)
], StockListQueryDTO.prototype, "bloodType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número da página (começa em 1)',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StockListQueryDTO.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Itens por página',
        example: 10,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], StockListQueryDTO.prototype, "limit", void 0);
//# sourceMappingURL=stock-list-query.dto.js.map