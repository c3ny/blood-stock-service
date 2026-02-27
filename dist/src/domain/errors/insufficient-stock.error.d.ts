export declare class InsufficientStockError extends Error {
    constructor(stockId: string, requiredQuantity: number, availableQuantity: number);
}
