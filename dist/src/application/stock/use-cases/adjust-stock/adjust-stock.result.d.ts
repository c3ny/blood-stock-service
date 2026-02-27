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
