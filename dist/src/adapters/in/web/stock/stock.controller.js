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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ports_1 = require("../../../../application/stock/ports");
const use_cases_1 = require("../../../../application/stock/use-cases");
const dto_1 = require("./dto");
const error_response_dto_1 = require("../common/error-response.dto");
let StockController = class StockController {
    adjustStockUseCase;
    listStocksUseCase;
    getStockByIdUseCase;
    getStockMovementsUseCase;
    constructor(adjustStockUseCase, listStocksUseCase, getStockByIdUseCase, getStockMovementsUseCase) {
        this.adjustStockUseCase = adjustStockUseCase;
        this.listStocksUseCase = listStocksUseCase;
        this.getStockByIdUseCase = getStockByIdUseCase;
        this.getStockMovementsUseCase = getStockMovementsUseCase;
    }
    async listStocks(query) {
        const result = await this.listStocksUseCase.execute({
            companyId: query.companyId,
            bloodType: query.bloodType,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
        });
        return {
            items: result.items.map((item) => this.mapStockReadToDTO(item)),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
    async getStockById(stockId) {
        const stock = await this.getStockByIdUseCase.execute(stockId);
        return this.mapStockReadToDTO(stock);
    }
    async getStockMovements(stockId, query) {
        const movements = await this.getStockMovementsUseCase.execute(stockId, query.limit ?? 50);
        return {
            items: movements.items.map((movement) => this.mapMovementReadToDTO(movement)),
            total: movements.total,
        };
    }
    async adjustStock(stockId, dto) {
        const command = new use_cases_1.AdjustStockCommand(stockId, dto.movement, dto.actionBy, dto.notes);
        const result = await this.adjustStockUseCase.execute(command);
        return {
            stockId: result.stockId,
            companyId: result.companyId,
            bloodType: result.bloodType,
            quantityABefore: result.quantityABefore,
            quantityBBefore: result.quantityBBefore,
            quantityABBefore: result.quantityABBefore,
            quantityOBefore: result.quantityOBefore,
            quantityAAfter: result.quantityAAfter,
            quantityBAfter: result.quantityBAfter,
            quantityABAfter: result.quantityABAfter,
            quantityOAfter: result.quantityOAfter,
            timestamp: result.timestamp,
        };
    }
    mapStockReadToDTO(stock) {
        return {
            id: stock.id,
            companyId: stock.companyId,
            bloodType: stock.bloodType,
            quantityA: stock.quantityA,
            quantityB: stock.quantityB,
            quantityAB: stock.quantityAB,
            quantityO: stock.quantityO,
            createdAt: stock.createdAt,
            updatedAt: stock.updatedAt,
        };
    }
    mapMovementReadToDTO(movement) {
        return {
            id: movement.id,
            stockId: movement.stockId,
            movement: movement.movement,
            quantityBefore: movement.quantityBefore,
            quantityAfter: movement.quantityAfter,
            actionBy: movement.actionBy,
            notes: movement.notes,
            createdAt: movement.createdAt,
        };
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar estoques de sangue',
        description: 'Retorna lista de todos os estoques de sangue com filtros opcionais por empresa e tipo sanguíneo. Suporta paginação.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'companyId',
        description: 'Filtrar por ID da empresa/hospital',
        required: false,
        type: String,
        example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'bloodType',
        description: 'Filtrar por tipo sanguíneo',
        required: false,
        enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
        example: 'O+',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        description: 'Número da página (começa em 1)',
        required: false,
        type: Number,
        example: 1,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: 'Itens por página',
        required: false,
        type: Number,
        example: 10,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de estoques retornada com sucesso',
        type: dto_1.StockListResponseDTO,
        example: {
            items: [
                {
                    id: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
                    companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
                    bloodType: 'O+',
                    quantityA: 0,
                    quantityB: 0,
                    quantityAB: 0,
                    quantityO: 100,
                    createdAt: '2026-02-27T19:17:56.000Z',
                    updatedAt: '2026-02-27T19:17:56.000Z',
                },
            ],
            total: 24,
            page: 1,
            limit: 10,
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Parâmetros de query inválidos',
        type: error_response_dto_1.ValidationErrorResponseDTO,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StockListQueryDTO]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "listStocks", null);
__decorate([
    (0, common_1.Get)(':stockId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar estoque por ID',
        description: 'Retorna os detalhes de um registro específico de estoque de sangue incluindo quantidades atuais de cada tipo.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'stockId',
        description: 'ID UUID do registro de estoque',
        type: String,
        example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estoque encontrado',
        type: dto_1.StockItemDTO,
        example: {
            id: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
            companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
            bloodType: 'O+',
            quantityA: 0,
            quantityB: 0,
            quantityAB: 0,
            quantityO: 100,
            createdAt: '2026-02-27T19:17:56.000Z',
            updatedAt: '2026-02-27T19:17:56.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Estoque não encontrado',
        type: error_response_dto_1.ErrorResponseDTO,
        example: {
            message: 'Stock with ID 26f6de4c-3e38-46ad-a9da-5d1e6bb663ae not found',
            error: 'Not Found',
            statusCode: 404,
        },
    }),
    __param(0, (0, common_1.Param)('stockId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getStockById", null);
__decorate([
    (0, common_1.Get)(':stockId/movements'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar histórico de movimentações',
        description: 'Retorna o histórico completo de todas as movimentações (entradas e saídas) de um estoque específico, ordenado por data (mais recentes primeiro).',
    }),
    (0, swagger_1.ApiParam)({
        name: 'stockId',
        description: 'ID UUID do registro de estoque',
        type: String,
        example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: 'Limitar número de resultados',
        required: false,
        type: Number,
        example: 50,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Histórico de movimentações retornado',
        type: dto_1.StockMovementsResponseDTO,
        example: {
            items: [
                {
                    id: 'abc123-def456-ghi789',
                    stockId: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
                    movement: 10,
                    quantityBefore: 100,
                    quantityAfter: 110,
                    actionBy: 'admin@bloodstock.com',
                    notes: 'Doação de sangue de campanha empresarial',
                    createdAt: '2026-02-27T19:17:56.000Z',
                },
            ],
            total: 5,
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Estoque não encontrado',
        type: error_response_dto_1.ErrorResponseDTO,
    }),
    __param(0, (0, common_1.Param)('stockId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.StockMovementsQueryDTO]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getStockMovements", null);
__decorate([
    (0, common_1.Patch)(':stockId/adjust'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Ajustar estoque de sangue',
        description: 'Realiza ajuste de entrada (+) ou saída (-) no estoque de sangue de um tipo específico. Registra a movimentação com auditoria completa incluindo usuário responsável, timestamp e observações.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'stockId',
        description: 'ID UUID do registro de estoque a ser ajustado',
        type: String,
        example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
    }),
    (0, swagger_1.ApiBody)({
        type: dto_1.AdjustStockRequestDTO,
        description: 'Dados da movimentação de estoque',
        examples: {
            entrada: {
                summary: 'Entrada de estoque (doação)',
                description: 'Exemplo de registro de entrada de sangue no estoque',
                value: {
                    movement: 10,
                    actionBy: 'admin@bloodstock.com',
                    notes: 'Doação de sangue de campanha empresarial',
                },
            },
            saida: {
                summary: 'Saída de estoque (transfusão)',
                description: 'Exemplo de registro de saída de sangue do estoque',
                value: {
                    movement: -5,
                    actionBy: 'doctor@hospital.com',
                    notes: 'Transfusão de emergência para cirurgia cardíaca',
                },
            },
            saidaUrgencia: {
                summary: 'Saída de urgência',
                description: 'Exemplo de uso em situação de emergência',
                value: {
                    movement: -15,
                    actionBy: 'emergency@hospital.com',
                    notes: 'Acidente automobilístico - politrauma - código vermelho',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estoque ajustado com sucesso',
        type: dto_1.AdjustStockResponseDTO,
        example: {
            stockId: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
            companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
            bloodType: 'O+',
            quantityABefore: 0,
            quantityBBefore: 0,
            quantityABBefore: 0,
            quantityOBefore: 100,
            quantityAAfter: 0,
            quantityBAfter: 0,
            quantityABAfter: 0,
            quantityOAfter: 110,
            timestamp: '2026-02-27T19:10:03.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Requisição inválida - Erro de validação ou estoque insuficiente',
        type: error_response_dto_1.ValidationErrorResponseDTO,
        example: {
            message: ['Movement cannot be zero', 'ActionBy is required'],
            error: 'Bad Request',
            statusCode: 400,
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Estoque não encontrado',
        type: error_response_dto_1.ErrorResponseDTO,
        example: {
            message: 'Stock not found',
            error: 'Not Found',
            statusCode: 404,
        },
    }),
    __param(0, (0, common_1.Param)('stockId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AdjustStockRequestDTO]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "adjustStock", null);
exports.StockController = StockController = __decorate([
    (0, swagger_1.ApiTags)('Estoque de Sangue'),
    (0, common_1.Controller)('stocks'),
    __param(0, (0, common_1.Inject)(ports_1.ADJUST_STOCK_USE_CASE)),
    __param(1, (0, common_1.Inject)(ports_1.LIST_STOCKS_USE_CASE)),
    __param(2, (0, common_1.Inject)(ports_1.GET_STOCK_BY_ID_USE_CASE)),
    __param(3, (0, common_1.Inject)(ports_1.GET_STOCK_MOVEMENTS_USE_CASE)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], StockController);
//# sourceMappingURL=stock.controller.js.map