export declare class StockItemDTO {
    id: string;
    companyId: string;
    bloodType: string;
    quantityA: number;
    quantityB: number;
    quantityAB: number;
    quantityO: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class StockListResponseDTO {
    items: StockItemDTO[];
    total: number;
    page?: number;
    limit?: number;
}
export declare class StockMovementDTO {
    id: string;
    stockId: string;
    movement: number;
    quantityBefore: number;
    quantityAfter: number;
    actionBy: string;
    notes: string;
    createdAt: Date;
}
export declare class StockMovementsResponseDTO {
    items: StockMovementDTO[];
    total: number;
}
