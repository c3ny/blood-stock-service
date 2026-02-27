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
exports.InsufficientStockErrorDTO = exports.ValidationErrorResponseDTO = exports.ErrorResponseDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
class ErrorResponseDTO {
    statusCode;
    code;
    message;
    details;
    traceId;
}
exports.ErrorResponseDTO = ErrorResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código HTTP do erro',
        example: 404,
        enum: [400, 401, 403, 404, 429, 500, 503],
    }),
    __metadata("design:type", Number)
], ErrorResponseDTO.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código interno padronizado da falha',
        example: 'STOCK_NOT_FOUND',
    }),
    __metadata("design:type", String)
], ErrorResponseDTO.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mensagem descritiva do erro',
        example: 'Stock with ID 26f6de4c-3e38-46ad-a9da-5d1e6bb663ae not found',
    }),
    __metadata("design:type", String)
], ErrorResponseDTO.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detalhes adicionais do erro para troubleshooting',
        required: false,
        example: {
            path: '/api/v1/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
            timestamp: '2026-02-27T20:20:10.125Z',
            errors: ['stockId must be a UUID'],
        },
    }),
    __metadata("design:type", Object)
], ErrorResponseDTO.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identificador de rastreamento da requisição',
        example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
    }),
    __metadata("design:type", String)
], ErrorResponseDTO.prototype, "traceId", void 0);
class ValidationErrorResponseDTO {
    statusCode;
    code;
    message;
    details;
    traceId;
}
exports.ValidationErrorResponseDTO = ValidationErrorResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código HTTP do erro',
        example: 400,
    }),
    __metadata("design:type", Number)
], ValidationErrorResponseDTO.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código interno padronizado da falha',
        example: 'VALIDATION_ERROR',
    }),
    __metadata("design:type", String)
], ValidationErrorResponseDTO.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mensagem resumida do erro',
        example: 'Validation failed',
    }),
    __metadata("design:type", String)
], ValidationErrorResponseDTO.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detalhes de validação por campo',
        example: {
            errors: ['movement must not be equal to 0'],
        },
    }),
    __metadata("design:type", Object)
], ValidationErrorResponseDTO.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identificador de rastreamento da requisição',
        example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
    }),
    __metadata("design:type", String)
], ValidationErrorResponseDTO.prototype, "traceId", void 0);
class InsufficientStockErrorDTO {
    statusCode;
    code;
    message;
    details;
    traceId;
}
exports.InsufficientStockErrorDTO = InsufficientStockErrorDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código HTTP do erro',
        example: 400,
    }),
    __metadata("design:type", Number)
], InsufficientStockErrorDTO.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código interno padronizado da falha',
        example: 'INSUFFICIENT_STOCK',
    }),
    __metadata("design:type", String)
], InsufficientStockErrorDTO.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mensagem de erro de estoque insuficiente',
        example: 'Insufficient stock for stockId abc123: requested 50 units, available 30 units',
    }),
    __metadata("design:type", String)
], InsufficientStockErrorDTO.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detalhes de disponibilidade e falta',
        example: {
            available: 30,
            requested: 50,
            shortage: 20,
        },
    }),
    __metadata("design:type", Object)
], InsufficientStockErrorDTO.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identificador de rastreamento da requisição',
        example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
    }),
    __metadata("design:type", String)
], InsufficientStockErrorDTO.prototype, "traceId", void 0);
//# sourceMappingURL=error-response.dto.js.map