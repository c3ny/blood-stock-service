import { AdjustStockUseCase } from '@application/stock/ports';
import { AdjustStockRequestDTO, AdjustStockResponseDTO } from './dto';
export declare class StockController {
    private readonly adjustStockUseCase;
    constructor(adjustStockUseCase: AdjustStockUseCase);
    adjustStock(stockId: string, dto: AdjustStockRequestDTO): Promise<AdjustStockResponseDTO>;
}
