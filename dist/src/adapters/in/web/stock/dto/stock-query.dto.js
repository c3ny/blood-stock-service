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
exports.StockMovementsResponseDTO = exports.StockMovementDTO = exports.StockListResponseDTO = exports.StockItemDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
class StockItemDTO {
    id;
    companyId;
    bloodType;
    quantityA;
    quantityB;
    quantityAB;
    quantityO;
    createdAt;
    updatedAt;
}
exports.StockItemDTO = StockItemDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único do registro de estoque',
        example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
        type: String,
        format: 'uuid',
    }),
    __metadata("design:type", String)
], StockItemDTO.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da empresa/hospital proprietária do estoque',
        example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
        type: String,
        format: 'uuid',
    }),
    __metadata("design:type", String)
], StockItemDTO.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo sanguíneo armazenado',
        example: 'O+',
        enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    }),
    __metadata("design:type", String)
], StockItemDTO.prototype, "bloodType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade atual de sangue tipo A',
        example: 50,
        type: Number,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], StockItemDTO.prototype, "quantityA", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade atual de sangue tipo B',
        example: 40,
        type: Number,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], StockItemDTO.prototype, "quantityB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade atual de sangue tipo AB',
        example: 30,
        type: Number,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], StockItemDTO.prototype, "quantityAB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade atual de sangue tipo O',
        example: 100,
        type: Number,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], StockItemDTO.prototype, "quantityO", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação do registro',
        example: '2026-02-27T19:17:56.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], StockItemDTO.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização',
        example: '2026-02-27T19:17:56.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], StockItemDTO.prototype, "updatedAt", void 0);
class StockListResponseDTO {
    items;
    total;
    page;
    limit;
}
exports.StockListResponseDTO = StockListResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de registros de estoque',
        type: [StockItemDTO],
    }),
    __metadata("design:type", Array)
], StockListResponseDTO.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total de registros encontrados',
        example: 24,
        type: Number,
    }),
    __metadata("design:type", Number)
], StockListResponseDTO.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Página atual (se paginado)',
        example: 1,
        type: Number,
        required: false,
    }),
    __metadata("design:type", Number)
], StockListResponseDTO.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens por página (se paginado)',
        example: 10,
        type: Number,
        required: false,
    }),
    __metadata("design:type", Number)
], StockListResponseDTO.prototype, "limit", void 0);
class StockMovementDTO {
    id;
    stockId;
    movement;
    quantityBefore;
    quantityAfter;
    actionBy;
    notes;
    createdAt;
}
exports.StockMovementDTO = StockMovementDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único da movimentação',
        example: 'abc123-def456-ghi789',
        type: String,
        format: 'uuid',
    }),
    __metadata("design:type", String)
], StockMovementDTO.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do estoque relacionado',
        example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
        type: String,
        format: 'uuid',
    }),
    __metadata("design:type", String)
], StockMovementDTO.prototype, "stockId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade movimentada (positivo = entrada, negativo = saída)',
        example: 10,
        type: Number,
    }),
    __metadata("design:type", Number)
], StockMovementDTO.prototype, "movement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade antes da movimentação',
        example: 100,
        type: Number,
    }),
    __metadata("design:type", Number)
], StockMovementDTO.prototype, "quantityBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade depois da movimentação',
        example: 110,
        type: Number,
    }),
    __metadata("design:type", Number)
], StockMovementDTO.prototype, "quantityAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Usuário ou sistema que realizou a movimentação',
        example: 'admin@bloodstock.com',
        type: String,
    }),
    __metadata("design:type", String)
], StockMovementDTO.prototype, "actionBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Observações sobre a movimentação',
        example: 'Doação de sangue de campanha empresarial',
        type: String,
    }),
    __metadata("design:type", String)
], StockMovementDTO.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data e hora da movimentação',
        example: '2026-02-27T19:17:56.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], StockMovementDTO.prototype, "createdAt", void 0);
class StockMovementsResponseDTO {
    items;
    total;
}
exports.StockMovementsResponseDTO = StockMovementsResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de movimentações',
        type: [StockMovementDTO],
    }),
    __metadata("design:type", Array)
], StockMovementsResponseDTO.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total de movimentações',
        example: 5,
        type: Number,
    }),
    __metadata("design:type", Number)
], StockMovementsResponseDTO.prototype, "total", void 0);
//# sourceMappingURL=stock-query.dto.js.map