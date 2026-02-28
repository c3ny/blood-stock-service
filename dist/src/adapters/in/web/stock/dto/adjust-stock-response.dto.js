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
exports.AdjustStockResponseDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdjustStockResponseDTO {
    stockId = '';
    companyId = '';
    bloodType = '';
    quantityABefore = 0;
    quantityBBefore = 0;
    quantityABBefore = 0;
    quantityOBefore = 0;
    quantityAAfter = 0;
    quantityBAfter = 0;
    quantityABAfter = 0;
    quantityOAfter = 0;
    timestamp = new Date();
}
exports.AdjustStockResponseDTO = AdjustStockResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do registro de estoque',
        example: '950c8baf-fed8-4d38-b99e-59c614251930',
        type: String,
    }),
    __metadata("design:type", String)
], AdjustStockResponseDTO.prototype, "stockId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da empresa/hospital',
        example: 'f5ba6e2f-43cc-49e8-8275-2b655209fc73',
        type: String,
    }),
    __metadata("design:type", String)
], AdjustStockResponseDTO.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo sanguíneo',
        example: 'O+',
        enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    }),
    __metadata("design:type", String)
], AdjustStockResponseDTO.prototype, "bloodType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo A antes da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityABefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo B antes da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityBBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo AB antes da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityABBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo O antes da movimentação',
        example: 100,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityOBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo A depois da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityAAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo B depois da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityBAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo AB depois da movimentação',
        example: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityABAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de sangue tipo O depois da movimentação',
        example: 110,
        type: Number,
    }),
    __metadata("design:type", Number)
], AdjustStockResponseDTO.prototype, "quantityOAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data e hora da movimentação',
        example: '2026-02-27T19:10:03.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], AdjustStockResponseDTO.prototype, "timestamp", void 0);
//# sourceMappingURL=adjust-stock-response.dto.js.map