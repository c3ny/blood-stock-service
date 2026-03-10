import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BatchEntity } from '../batch/entities/batch.entity';
import { BatchEntryRequestDto } from './dto/request/batch-entry-request.dto';
import { BatchExitRequestDto } from './dto/request/batch-exit-request.dto';
import { BatchResponseDto } from './dto/response/batch-response.dto';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';
import { StockService } from './stock.service';

/**
 * Controller HTTP do módulo de estoque.
 * Expõe endpoints compatíveis com o contrato legado da API Java.
 */
@ApiTags('📦 Estoque de Sangue')
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Lista todos os itens de estoque do sistema.
   */
  @ApiOperation({ summary: 'Listar todos os lotes da empresa' })
  @Get('/company/:companyId')
  findByCompany(
    @Param('companyId') companyId: string,
  ): Promise<BatchResponseDto[]> {
    return this.stockService
      .findByCompany(companyId)
      .then((stocks) => stocks.map((stock) => this.mapStockToLegacyDto(stock)));
  }

  /**
   * Atualiza a quantidade de um item de estoque por ID.
   */
  @ApiOperation({ summary: 'Atualizar quantidade de um item do estoque' })
  @Put('/:userId/:companyId/:batchCode')
  updateQuantity(
    @Param('batchCode') batchCode: string,
    @Param('userId') userId: string,
    @Query('quantity', ParseIntPipe) quantity: number,
  ): Promise<BatchResponseDto> {
    return this.stockService
      .updateQuantity(userId, batchCode, quantity)
      .then((stock) => this.mapStockToLegacyDto(stock));
  }

  /**
   * Processa entrada em lote validando o payload e retornando o lote criado/atualizado.
   */
  @ApiOperation({ summary: 'Entrada de estoque por lote' })
  @Post('/:userId/:companyId/batchEntry')
  @HttpCode(HttpStatus.CREATED)
  async batchEntry(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: BatchEntryRequestDto,
  ): Promise<BatchResponseDto[]> {

    const newBatch = await this.stockService.processBatchEntry(userId, companyId, dto);
    return [this.mapToDto(newBatch)];

  }

  /**
   * Processa saída em lote e retorna a posição atual de estoque da empresa.
   */
  @ApiOperation({ summary: 'Saída de estoque por lote' })
  @Post('/:userId/:companyId/:batchCode/batchExit')
  @HttpCode(HttpStatus.OK)
  async processBulkExit(
  @Param('companyId') companyId: string,
  @Param('userId') userId: string,
  @Body() dto: BatchExitRequestDto,
): Promise<BatchResponseDto[]> {
  await this.stockService.processBatchExit(userId, companyId, dto);
  const companyStock = await this.stockService.findByCompany(companyId);
  return companyStock.map((stock) => this.mapStockToLegacyDto(stock));
  // Se erro → GlobalExceptionFilter pega automaticamente
}

  /**
   * Retorna o histórico de movimentações de um item de estoque.
   */
  @ApiOperation({ summary: 'Histórico de movimentações' })
  @Get('/:batchCode/history')
  getHistory(@Param('batchCode') batchCode: string): Promise<BloodstockMovementEntity[]> {
    return this.stockService.getHistoryByBatchCode(batchCode);
  }

  /**
   * Gera relatório CSV com os itens de estoque da empresa.
   */
  @ApiOperation({ summary: 'Gerar relatório CSV' })
  @Get('/:companyId/report')
  async generateReport(
    @Param('companyId') companyId: string,
    @Res() res: Response,
  ): Promise<void> {
    const stockList = await this.stockService.findByCompany(companyId);

    const csvContent = [
      'Tipo Sanguíneo,Quantidade,Data de Entrada,Data de Saída',
      ...stockList.map(
        (stock) =>
          `${stock.bloodType},${stock.quantity},${stock.entryDate ?? ''},${stock.exitDate ?? ''}`,
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="stock_report.csv"');
    res.status(HttpStatus.OK).send(csvContent);
  }

  /**
   * Converte entidade de lote para DTO de resposta da API.
   */
  private mapToDto(batch: BatchEntity): BatchResponseDto {
    return {
      id: batch.id,
      batchCode: batch.batchCode,
      entryDate: batch.entryDate ?? null,
      exitDate: batch.exitDate ?? null,
      bloodDetails:
        batch.bloodDetails?.map((detail) => ({
          id: detail.id,
          bloodType: detail.bloodType,
          quantity: detail.quantity,
        })) ?? "Sem detalhes",
    };
  }

  /**
   * Converte entidade de estoque para formato legado em snake_case.
   */
  private mapStockToLegacyDto(stock: BloodstockEntity): BatchResponseDto {
    return {
      id: stock.id,
      batchCode: stock.batchCode ?? '',
      entryDate: stock.entryDate ?? null,
      exitDate: stock.exitDate ?? null,
      bloodDetails: [
        {
          id: stock.id,
          bloodType: stock.bloodType,
          quantity: stock.quantity,
        },
      ],
    };
  }
}