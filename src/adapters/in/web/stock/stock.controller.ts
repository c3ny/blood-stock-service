import { Controller, Patch, Get, Param, Body, Query, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import {
  ADJUST_STOCK_USE_CASE,
  AdjustStockUseCase,
  GET_STOCK_BY_ID_USE_CASE,
  GetStockByIdUseCase,
  GET_STOCK_MOVEMENTS_USE_CASE,
  GetStockMovementsUseCase,
  LIST_STOCKS_USE_CASE,
  ListStocksUseCase,
  StockReadModel,
  StockMovementReadModel,
} from '@application/stock/ports';
import { AdjustStockCommand } from '@application/stock/use-cases';
import { 
  AdjustStockRequestDTO, 
  AdjustStockResponseDTO,
  StockListQueryDTO,
  StockMovementsQueryDTO,
  StockItemDTO,
  StockMovementDTO,
  StockListResponseDTO,
  StockMovementsResponseDTO,
} from './dto';
import { ErrorResponseDTO, ValidationErrorResponseDTO } from '../common/error-response.dto';

@ApiTags('Estoque de Sangue')
@Controller('stocks')
export class StockController {
  constructor(
    @Inject(ADJUST_STOCK_USE_CASE)
    private readonly adjustStockUseCase: AdjustStockUseCase,
    @Inject(LIST_STOCKS_USE_CASE)
    private readonly listStocksUseCase: ListStocksUseCase,
    @Inject(GET_STOCK_BY_ID_USE_CASE)
    private readonly getStockByIdUseCase: GetStockByIdUseCase,
    @Inject(GET_STOCK_MOVEMENTS_USE_CASE)
    private readonly getStockMovementsUseCase: GetStockMovementsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar estoques de sangue',
    description: 'Retorna lista de todos os estoques de sangue com filtros opcionais por empresa e tipo sanguíneo. Suporta paginação.',
  })
  @ApiQuery({
    name: 'companyId',
    description: 'Filtrar por ID da empresa/hospital',
    required: false,
    type: String,
    example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
  })
  @ApiQuery({
    name: 'bloodType',
    description: 'Filtrar por tipo sanguíneo',
    required: false,
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    example: 'O+',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número da página (começa em 1)',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Itens por página',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estoques retornada com sucesso',
    type: StockListResponseDTO,
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
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de query inválidos',
    type: ValidationErrorResponseDTO,
  })
  async listStocks(
    @Query() query: StockListQueryDTO,
  ): Promise<StockListResponseDTO> {
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

  @Get(':stockId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar estoque por ID',
    description: 'Retorna os detalhes de um registro específico de estoque de sangue incluindo quantidades atuais de cada tipo.',
  })
  @ApiParam({
    name: 'stockId',
    description: 'ID UUID do registro de estoque',
    type: String,
    example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque encontrado',
    type: StockItemDTO,
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
  })
  @ApiResponse({
    status: 404,
    description: 'Estoque não encontrado',
    type: ErrorResponseDTO,
    example: {
      message: 'Stock with ID 26f6de4c-3e38-46ad-a9da-5d1e6bb663ae not found',
      error: 'Not Found',
      statusCode: 404,
    },
  })
  async getStockById(@Param('stockId') stockId: string): Promise<StockItemDTO> {
    const stock = await this.getStockByIdUseCase.execute(stockId);
    return this.mapStockReadToDTO(stock);
  }

  @Get(':stockId/movements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar histórico de movimentações',
    description: 'Retorna o histórico completo de todas as movimentações (entradas e saídas) de um estoque específico, ordenado por data (mais recentes primeiro).',
  })
  @ApiParam({
    name: 'stockId',
    description: 'ID UUID do registro de estoque',
    type: String,
    example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limitar número de resultados',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de movimentações retornado',
    type: StockMovementsResponseDTO,
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
  })
  @ApiResponse({
    status: 404,
    description: 'Estoque não encontrado',
    type: ErrorResponseDTO,
  })
  async getStockMovements(
    @Param('stockId') stockId: string,
    @Query() query: StockMovementsQueryDTO,
  ): Promise<StockMovementsResponseDTO> {
    const movements = await this.getStockMovementsUseCase.execute(stockId, query.limit ?? 50);

    return {
      items: movements.items.map((movement) => this.mapMovementReadToDTO(movement)),
      total: movements.total,
    };
  }

  @Patch(':stockId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ajustar estoque de sangue',
    description: 'Realiza ajuste de entrada (+) ou saída (-) no estoque de sangue de um tipo específico. Registra a movimentação com auditoria completa incluindo usuário responsável, timestamp e observações.',
  })
  @ApiParam({
    name: 'stockId',
    description: 'ID UUID do registro de estoque a ser ajustado',
    type: String,
    example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
  })
  @ApiBody({
    type: AdjustStockRequestDTO,
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
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque ajustado com sucesso',
    type: AdjustStockResponseDTO,
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
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - Erro de validação ou estoque insuficiente',
    type: ValidationErrorResponseDTO,
    example: {
      message: ['Movement cannot be zero', 'ActionBy is required'],
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Estoque não encontrado',
    type: ErrorResponseDTO,
    example: {
      message: 'Stock not found',
      error: 'Not Found',
      statusCode: 404,
    },
  })
  async adjustStock(
    @Param('stockId') stockId: string,
    @Body() dto: AdjustStockRequestDTO,
  ): Promise<AdjustStockResponseDTO> {
    const command = new AdjustStockCommand(stockId, dto.movement, dto.actionBy, dto.notes);
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

  private mapStockReadToDTO(stock: StockReadModel): StockItemDTO {
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

  private mapMovementReadToDTO(movement: StockMovementReadModel): StockMovementDTO {
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
}
