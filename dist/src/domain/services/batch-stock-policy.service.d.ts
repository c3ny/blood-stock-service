import { StockMovement, Batch, StockItem } from '../entities';
export declare class BatchStockPolicyService {
    coordinateStockMovement(batch: Batch, stock: StockItem, movement: number, actionBy: string, notes: string): StockMovement;
    private getQuantityByBloodType;
}
