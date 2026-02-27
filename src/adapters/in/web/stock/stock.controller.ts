import { Controller, Patch, Param, Body, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ADJUST_STOCK_USE_CASE, AdjustStockUseCase } from '@application/stock/ports';
import { AdjustStockCommand } from '@application/stock/use-cases';
import { InsufficientStockError } from '@domain/errors';
import { AdjustStockRequestDTO, AdjustStockResponseDTO } from './dto';

@Controller('stocks')
export class StockController {
  constructor(
    @Inject(ADJUST_STOCK_USE_CASE)
    private readonly adjustStockUseCase: AdjustStockUseCase,
  ) {}

  @Patch(':stockId/adjust')
  async adjustStock(
    @Param('stockId') stockId: string,
    @Body() dto: AdjustStockRequestDTO,
  ): Promise<AdjustStockResponseDTO> {
    try {
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
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error && error.message.includes('Stock not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
