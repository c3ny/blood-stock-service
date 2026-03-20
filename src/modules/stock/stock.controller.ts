import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  HttpCode,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { BatchEntryRequestDto } from './dto/request/batch-entry-request.dto';
import { BatchExitRequestDto } from './dto/request/batch-exit-request.dto';
import { BatchResponseDto } from './dto/response/batch-response.dto';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';
import { StockService } from './stock.service';
import { InitStockRequestDto } from './dto/request/init-stock-request.dto';
import { SkipAuth } from '../shared/auth/skip-auth.decorator';

@ApiTags('Estoque de Sangue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({ summary: 'Listar estoque da empresa' })
  @ApiResponse({ status: 200, description: 'Estoque retornado com sucesso', type: [BatchResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Get()
  findByCompany(@Req() req: Request): Promise<BatchResponseDto[]> {
    const companyId = (req.user as any).companyId;
    return this.stockService
      .findByCompany(companyId)
      .then((stocks) => stocks.map((stock) => this.mapStockToDto(stock)));
  }

  @ApiOperation({ summary: 'Entrada de estoque por lote' })
  @ApiResponse({ status: 201, description: 'Entrada registrada, retorna estoque atualizado', type: [BatchResponseDto] })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Post('/batchEntry')
  @HttpCode(HttpStatus.CREATED)
  async batchEntry(
    @Req() req: Request,
    @Body() dto: BatchEntryRequestDto,
  ): Promise<BatchResponseDto[]> {
    const companyId = (req.user as any).companyId;
    await this.stockService.processBatchEntry(dto.batchCode, companyId, dto);
    const companyStock = await this.stockService.findByCompany(companyId);
    return companyStock.map((stock) => this.mapStockToDto(stock));
  }

  @ApiOperation({ summary: 'Listar lotes disponíveis por tipo sanguíneo (FEFO)' })
  @ApiParam({ name: 'bloodType', description: 'Tipo sanguíneo (ex: A+, O-, AB+)', example: 'A+' })
  @ApiResponse({ status: 200, description: 'Lotes disponíveis ordenados por vencimento' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Get('/batches/:bloodType')
  getAvailableBatches(
    @Req() req: Request,
    @Param('bloodType') bloodType: string,
  ): Promise<any[]> {
    const companyId = (req.user as any).companyId;
    return this.stockService.getAvailableBatchesByBloodType(
      companyId,
      bloodType,
    );
  }

  @ApiOperation({ summary: 'Saída de estoque (regra FEFO)' })
  @ApiResponse({ status: 200, description: 'Saída registrada, retorna estoque atualizado', type: [BatchResponseDto] })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Post('/batchExit')
  @HttpCode(HttpStatus.OK)
  async processBulkExit(
    @Req() req: Request,
    @Body() dto: BatchExitRequestDto,
  ): Promise<BatchResponseDto[]> {
    const companyId = (req.user as any).companyId;
    await this.stockService.processBatchExit(companyId, dto);
    const companyStock = await this.stockService.findByCompany(companyId);
    return companyStock.map((stock) => this.mapStockToDto(stock));
  }

  @ApiOperation({ summary: 'Histórico de movimentações' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Get('/history')
  getHistory(@Req() req: Request): Promise<BloodstockMovementEntity[]> {
    const companyId = (req.user as any).companyId;
    return this.stockService.getHistoryByCompany(companyId);
  }

  @ApiOperation({ summary: 'Gerar relatório CSV do estoque' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'Arquivo CSV gerado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @Get('/report')
  async generateReport(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const companyId = (req.user as any).companyId;
    const stockList = await this.stockService.findByCompany(companyId);

    const csvContent = [
      'Tipo Sanguíneo,Quantidade',
      ...stockList.map((stock) => `${stock.bloodType},${stock.quantity}`),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="stock_report.csv"',
    );
    res.status(HttpStatus.OK).send(csvContent);
  }

  @ApiOperation({ summary: 'Inicializar estoque da empresa (webhook interno)' })
  @ApiResponse({ status: 201, description: 'Estoque inicializado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @SkipAuth()
  @Post('/init')
  @HttpCode(HttpStatus.CREATED)
  async initStock(@Body() dto: InitStockRequestDto): Promise<void> {
    return this.stockService.initializeCompanyStock(dto);
  }

  private mapStockToDto(stock: BloodstockEntity): BatchResponseDto {
    return {
      id: stock.id,
      bloodType: stock.bloodType,
      quantity: stock.quantity,
    };
  }
}
