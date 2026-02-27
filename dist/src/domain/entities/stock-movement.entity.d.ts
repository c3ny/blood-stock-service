import { EntityId, Quantity } from '../value-objects';
export interface IStockMovement {
    id: EntityId;
    stockId: EntityId;
    quantityBefore: Quantity;
    movement: number;
    quantityAfter: Quantity;
    actionBy: string;
    notes: string;
    createdAt: Date;
}
export declare class StockMovement {
    private id;
    private stockId;
    private quantityBefore;
    private movement;
    private quantityAfter;
    private actionBy;
    private notes;
    private createdAt;
    constructor(data: IStockMovement);
    getId(): EntityId;
    getStockId(): EntityId;
    getQuantityBefore(): Quantity;
    getMovement(): number;
    getQuantityAfter(): Quantity;
    getActionBy(): string;
    getNotes(): string;
    getCreatedAt(): Date;
}
