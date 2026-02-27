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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../../out/persistence/prisma/prisma.service");
const health_response_dto_1 = require("./dto/health-response.dto");
let HealthController = class HealthController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkHealth() {
        const uptime = process.uptime();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(uptime),
                version: '1.0.0',
                services: {
                    database: 'up',
                    api: 'up',
                },
            };
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException({
                code: 'SERVICE_UNAVAILABLE',
                message: 'Database connection failed',
                details: {
                    reason: error instanceof Error ? error.message : 'unknown error',
                },
            });
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Health Check',
        description: 'Verifica o status de saúde da aplicação e suas dependências. ' +
            'Útil para monitoramento em ambientes Kubernetes, Docker Swarm e ferramentas de observabilidade.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Aplicação está saudável',
        type: health_response_dto_1.HealthResponseDTO,
        example: {
            status: 'healthy',
            timestamp: '2025-02-27T14:30:00.000Z',
            uptime: 3600,
            version: '1.0.0',
            services: {
                database: 'up',
                api: 'up',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Aplicação ou dependências com problemas',
        example: {
            status: 'unhealthy',
            timestamp: '2025-02-27T14:30:00.000Z',
            uptime: 3600,
            version: '1.0.0',
            services: {
                database: 'down',
                api: 'up',
            },
            error: 'Database connection failed',
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "checkHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Sistema'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
//# sourceMappingURL=health.controller.js.map