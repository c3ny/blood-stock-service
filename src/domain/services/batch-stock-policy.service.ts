import { StockMovement, Batch, StockItem } from '../entities';
import { EntityId, Quantity } from '../value-objects';

export class BatchStockPolicyService {
  /**
   * Coordinates batch and stock operations to ensure consistency.
   * When a batch movement happens, it affects both the batch aggregate and the stock item.
   */
  coordinateStockMovement(
    batch: Batch,
    stock: StockItem,
    movement: number,
    actionBy: string,
    notes: string,
  ): StockMovement {
    const quantityBefore = this.getQuantityByBloodType(stock, stock.getBloodType().getValue());
    const quantityAfter = new Quantity(quantityBefore.getValue() + movement);

    const stockMovement = new StockMovement({
      id: new EntityId(),
      stockId: stock.getId(),
      quantityBefore,
      movement,
      quantityAfter,
      actionBy,
      notes,
      createdAt: new Date(),
    });

    return stockMovement;
  }

  private getQuantityByBloodType(stock: StockItem, bloodType: string): Quantity {
    const type = bloodType;
    if (type === 'A+' || type === 'A-') return stock.getQuantityA();
    if (type === 'B+' || type === 'B-') return stock.getQuantityB();
    if (type === 'AB+' || type === 'AB-') return stock.getQuantityAB();
    if (type === 'O+' || type === 'O-') return stock.getQuantityO();
    throw new Error(`Unknown blood type: ${type}`);
  }
}
