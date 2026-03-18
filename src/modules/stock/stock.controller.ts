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
} from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../shared/auth/jwt-auth.guard";
import { BatchEntity } from "../batch/entities/batch.entity";
import { BatchEntryRequestDto } from "./dto/request/batch-entry-request.dto";
import { BatchExitRequestDto } from "./dto/request/batch-exit-request.dto";
import { BatchResponseDto } from "./dto/response/batch-response.dto";
import { BloodstockMovementEntity } from "./entities/bloodstock-movement.entity";
import { BloodstockEntity } from "./entities/bloodstock.entity";
import { StockService } from "./stock.service";
import { InitStockRequestDto } from "./dto/request/init-stock-request.dto";
import { SkipAuth } from "../shared/auth/skip-auth.decorator";

@ApiTags("📦 Estoque de Sangue")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // ← protege todos os endpoints
@Controller("api/stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({ summary: "Listar todos os lotes da empresa" })
  @Get()
  findByCompany(@Req() req: Request): Promise<BatchResponseDto[]> {
    const companyId = (req.user as any).companyId; // ← vem do token
    return this.stockService
      .findByCompany(companyId)
      .then((stocks) => stocks.map((stock) => this.mapStockToDto(stock)));
  }

  @ApiOperation({ summary: "Entrada de estoque por lote" })
  @Post("/batchEntry")
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

  // stock.controller.ts
  @ApiOperation({ summary: "Listar lotes disponíveis por tipo sanguíneo" })
  @Get("/batches/:bloodType")
  getAvailableBatches(
    @Req() req: Request,
    @Param("bloodType") bloodType: string,
  ): Promise<any[]> {
    const companyId = (req.user as any).companyId;
    return this.stockService.getAvailableBatchesByBloodType(
      companyId,
      bloodType,
    );
  }

  @ApiOperation({ summary: "Saída de estoque por lote" })
  @Post("/batchExit")
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

  // getHistory atualizado
  @ApiOperation({ summary: "Histórico de movimentações" })
  @Get("/history")
  getHistory(@Req() req: Request): Promise<BloodstockMovementEntity[]> {
    const companyId = (req.user as any).companyId;
    return this.stockService.getHistoryByCompany(companyId); // ← era getHistoryByBatchCode
  }

  @ApiOperation({ summary: "Gerar relatório CSV" })
  @Get("/report")
  async generateReport(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const companyId = (req.user as any).companyId;
    const stockList = await this.stockService.findByCompany(companyId);

    const csvContent = [
      "Tipo Sanguíneo,Quantidade,Data de Entrada,Data de Saída",
      ...stockList.map((stock) => `${stock.bloodType},${stock.quantity}}`),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="stock_report.csv"',
    );
    res.status(HttpStatus.OK).send(csvContent);
  }

  private mapToDto(stock: BloodstockEntity): BatchResponseDto {
    return {
      id: stock.id,
      bloodType: stock.bloodType,
      quantity: stock.quantity,
    };
  }

  @ApiOperation({ summary: "Inicializar estoque da empresa (webhook interno)" })
  @SkipAuth()
  @Post("/init")
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
