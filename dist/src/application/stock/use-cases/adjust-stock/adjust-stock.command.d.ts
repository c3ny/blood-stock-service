export declare class AdjustStockCommand {
    readonly stockId: string;
    readonly movement: number;
    readonly actionBy: string;
    readonly notes: string;
    constructor(stockId: string, movement: number, actionBy: string, notes: string);
}
