import { AdjustStockCommand } from '@application/stock/use-cases/adjust-stock/adjust-stock.command';
import { AdjustStockResult } from '@application/stock/use-cases/adjust-stock/adjust-stock.result';
export interface AdjustStockUseCase {
    execute(command: AdjustStockCommand): Promise<AdjustStockResult>;
}
export declare const ADJUST_STOCK_USE_CASE: unique symbol;
