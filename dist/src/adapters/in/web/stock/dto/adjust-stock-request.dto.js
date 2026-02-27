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
exports.AdjustStockRequestDTO = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AdjustStockRequestDTO {
    movement = 0;
    actionBy = '';
    notes = '';
}
exports.AdjustStockRequestDTO = AdjustStockRequestDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade a ser ajustada no estoque (positivo para entrada, negativo para saída)',
        example: 10,
        type: Number,
        minimum: -999999,
        maximum: 999999,
    }),
    (0, class_validator_1.IsInt)({ message: 'Movement must be an integer' }),
    (0, class_validator_1.NotEquals)(0, { message: 'Movement cannot be zero' }),
    __metadata("design:type", Number)
], AdjustStockRequestDTO.prototype, "movement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identificador do usuário ou sistema que realizou a movimentação',
        example: 'admin@bloodstock.com',
        type: String,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)({ message: 'ActionBy must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ActionBy is required' }),
    (0, class_validator_1.MaxLength)(255, { message: 'ActionBy must not exceed 255 characters' }),
    __metadata("design:type", String)
], AdjustStockRequestDTO.prototype, "actionBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Observações ou justificativa para a movimentação',
        example: 'Doação de sangue de campanha empresarial',
        type: String,
        maxLength: 1000,
        required: false,
    }),
    (0, class_validator_1.IsString)({ message: 'Notes must be a string' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'Notes must not exceed 1000 characters' }),
    __metadata("design:type", String)
], AdjustStockRequestDTO.prototype, "notes", void 0);
//# sourceMappingURL=adjust-stock-request.dto.js.map