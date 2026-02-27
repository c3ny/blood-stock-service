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
exports.HealthResponseDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
class HealthResponseDTO {
    status;
    timestamp;
    uptime;
    version;
    services;
    error;
}
exports.HealthResponseDTO = HealthResponseDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status geral da aplicação',
        example: 'healthy',
        enum: ['healthy', 'unhealthy'],
    }),
    __metadata("design:type", String)
], HealthResponseDTO.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp da verificação (ISO 8601)',
        example: '2025-02-27T14:30:00.000Z',
        format: 'date-time',
    }),
    __metadata("design:type", String)
], HealthResponseDTO.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tempo de atividade da aplicação em segundos',
        example: 3600,
        type: 'number',
    }),
    __metadata("design:type", Number)
], HealthResponseDTO.prototype, "uptime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Versão da aplicação',
        example: '1.0.0',
    }),
    __metadata("design:type", String)
], HealthResponseDTO.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status dos serviços/dependências',
        example: {
            database: 'up',
            api: 'up',
        },
        type: 'object',
        properties: {
            database: {
                type: 'string',
                enum: ['up', 'down'],
                description: 'Status da conexão com o banco de dados',
            },
            api: {
                type: 'string',
                enum: ['up', 'down'],
                description: 'Status da API',
            },
        },
    }),
    __metadata("design:type", Object)
], HealthResponseDTO.prototype, "services", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mensagem de erro em caso de falha (opcional)',
        required: false,
        example: 'Database connection timeout',
    }),
    __metadata("design:type", String)
], HealthResponseDTO.prototype, "error", void 0);
//# sourceMappingURL=health-response.dto.js.map