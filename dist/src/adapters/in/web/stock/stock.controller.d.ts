import { AdjustStockUseCase, GetStockByIdUseCase, GetStockMovementsUseCase, ListStocksUseCase } from '@application/stock/ports';
import { AdjustStockRequestDTO, AdjustStockResponseDTO, StockListQueryDTO, StockMovementsQueryDTO, StockItemDTO, StockListResponseDTO, StockMovementsResponseDTO } from './dto';
export declare class StockController {
    private readonly adjustStockUseCase;
    private readonly listStocksUseCase;
    private readonly getStockByIdUseCase;
    private readonly getStockMovementsUseCase;
    constructor(adjustStockUseCase: AdjustStockUseCase, listStocksUseCase: ListStocksUseCase, getStockByIdUseCase: GetStockByIdUseCase, getStockMovementsUseCase: GetStockMovementsUseCase);
    listStocks(query: StockListQueryDTO): Promise<StockListResponseDTO>;
    getStockById(stockId: string): Promise<StockItemDTO>;
    getStockMovements(stockId: string, query: StockMovementsQueryDTO): Promise<StockMovementsResponseDTO>;
    adjustStock(stockId: string, dto: AdjustStockRequestDTO): Promise<AdjustStockResponseDTO>;
    private mapStockReadToDTO;
    private mapMovementReadToDTO;
}
