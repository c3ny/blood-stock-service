export declare class AdjustStockCommand {
    readonly stockId: string;
    readonly movement: number;
    readonly actionBy: string;
    readonly notes: string;
    constructor(stockId: string, movement: number, actionBy: string, notes: string);
}
export declare class AdjustStockResult {
    readonly stockId: string;
    readonly companyId: string;
    readonly bloodType: string;
    readonly quantityABefore: number;
    readonly quantityBBefore: number;
    readonly quantityABBefore: number;
    readonly quantityOBefore: number;
    readonly quantityAAfter: number;
    readonly quantityBAfter: number;
    readonly quantityABAfter: number;
    readonly quantityOAfter: number;
    readonly timestamp: Date;
    constructor(stockId: string, companyId: string, bloodType: string, quantityABefore: number, quantityBBefore: number, quantityABBefore: number, quantityOBefore: number, quantityAAfter: number, quantityBAfter: number, quantityABAfter: number, quantityOAfter: number, timestamp: Date);
}
export interface AdjustStockUseCase {
    execute(command: AdjustStockCommand): Promise<AdjustStockResult>;
}
export declare const ADJUST_STOCK_USE_CASE: unique symbol;
