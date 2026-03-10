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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BatchEntity } from '../batch/entities/batch.entity';
import { BatchEntryRequestDto } from './dto/batch-entry-request.dto';
import { BatchExitBulkRequestDto } from './dto/batch-exit-bulk-request.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { BloodstockResponseDto } from './dto/bloodstock-response.dto';
import { BloodstockMovementRequestDto } from './dto/bloodstock-movement-request.dto';
import { CreateBloodstockDto } from './dto/create-bloodstock.dto';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';
import { StockService } from './stock.service';

@ApiTags('📦 Estoque de Sangue')
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({ summary: 'Criar registro de estoque vinculado a uma empresa' })
  @Post('/company/:companyId')
  createWithCompany(
    @Body() payload: CreateBloodstockDto,
    @Param('companyId') companyId: string,
  ): Promise<BloodstockResponseDto> {
    return this.stockService
      .save(payload, companyId)
      .then((stock) => this.mapStockToLegacyDto(stock));
  }

  @ApiOperation({ summary: 'Listar estoque global' })
  @Get()
  listAll(): Promise<BloodstockResponseDto[]> {
    return this.stockService
      .listAll()
      .then((stocks) => stocks.map((stock) => this.mapStockToLegacyDto(stock)));
  }

  @ApiOperation({ summary: 'Atualizar quantidade de um item do estoque' })
  @Put('/:id')
  updateQuantity(
    @Param('id') id: string,
    @Query('quantity', ParseIntPipe) quantity: number,
  ): Promise<BloodstockResponseDto> {
    return this.stockService
      .updateQuantity(id, quantity)
      .then((stock) => this.mapStockToLegacyDto(stock));
  }

  @ApiOperation({ summary: 'Movimentação de estoque' })
  @Post('/company/:companyId/movement')
  async moveStock(
    @Param('companyId') companyId: string,
    @Body() dto: BloodstockMovementRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const updated = await this.stockService.updateQuantity(dto.bloodstockId, dto.quantity);
      res.status(HttpStatus.OK).json(this.mapStockToLegacyDto(updated));
    } catch {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

  @ApiOperation({ summary: 'Entrada de estoque por lote' })
  @Post('/company/:companyId/batch-entry')
  async batchEntry(
    @Param('companyId') companyId: string,
    @Body() dto: BatchEntryRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const fieldErrors = dto.validateQuantities();
    if (fieldErrors.length > 0) {
      res.status(HttpStatus.BAD_REQUEST).json(fieldErrors);
      return;
    }

    try {
      const newBatch = await this.stockService.processBatchEntry(companyId, dto);
      res.status(HttpStatus.CREATED).json([this.mapToDto(newBatch)]);
    } catch {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

  @ApiOperation({ summary: 'Saída em lote' })
  @Post('/company/:companyId/batch-exit/bulk')
  async processBulkExit(
    @Param('companyId') companyId: string,
    @Body() dto: BatchExitBulkRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.stockService.processBulkBatchExit(companyId, dto);
      const companyStock = await this.stockService.findByCompany(companyId);
      res
        .status(HttpStatus.OK)
        .json(companyStock.map((stock) => this.mapStockToLegacyDto(stock)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar saída em lote';
      res.status(HttpStatus.BAD_REQUEST).json(message);
    }
  }

  @ApiOperation({ summary: 'Obter estoque de uma empresa' })
  @Get('/company/:companyId')
  async getStockByCompany(
    @Param('companyId') companyId: string,
    @Res() res: Response,
  ): Promise<void> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        companyId,
      );

    if (!isUuid) {
      res.status(HttpStatus.BAD_REQUEST).json([]);
      return;
    }

    const result = await this.stockService.findByCompany(companyId);
    res
      .status(HttpStatus.OK)
      .json(result.map((stock) => this.mapStockToLegacyDto(stock)));
  }

  @ApiOperation({ summary: 'Histórico de movimentações' })
  @Get('/:bloodstockId/history')
  getHistory(@Param('bloodstockId') bloodstockId: string): Promise<BloodstockMovementEntity[]> {
    return this.stockService.getHistoryByBloodstockId(bloodstockId);
  }

  @ApiOperation({ summary: 'Gerar relatório CSV' })
  @Get('/report/:companyId')
  async generateReport(
    @Param('companyId') companyId: string,
    @Res() res: Response,
  ): Promise<void> {
    const stockList = await this.stockService.findByCompany(companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bloodstock_report.csv"');
    res.write('Blood Type,Quantity,Date\n');

    for (const item of stockList) {
      const line = `${item.bloodType},${item.quantity},${item.updateDate ?? ''}`;
      res.write(`${line}\n`);
    }

    res.end();
  }

  private mapToDto(batch: BatchEntity): BatchResponseDto {
    return {
      id: batch.id,
      batchCode: batch.batchCode,
      entryDate: batch.entryDate ?? null,
      bloodDetails:
        batch.bloodDetails?.map((detail) => ({
          id: detail.id,
          bloodType: detail.bloodType,
          quantity: detail.quantity,
        })) ?? [],
    };
  }

  private mapStockToLegacyDto(stock: BloodstockEntity): BloodstockResponseDto {
    return {
      id: stock.id,
      blood_type: stock.bloodType,
      update_date: stock.updateDate ?? null,
      quantity: stock.quantity,
    };
  }
}