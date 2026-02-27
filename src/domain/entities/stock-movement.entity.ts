import { EntityId, Quantity } from '../value-objects';
import { InvalidStockMovementError } from '../errors';

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

export class StockMovement {
  private id: EntityId;
  private stockId: EntityId;
  private quantityBefore: Quantity;
  private movement: number;
  private quantityAfter: Quantity;
  private actionBy: string;
  private notes: string;
  private createdAt: Date;

  constructor(data: IStockMovement) {
    const expectedQuantityAfter = data.quantityBefore.getValue() + data.movement;
    if (data.quantityAfter.getValue() !== expectedQuantityAfter) {
      throw new InvalidStockMovementError(
        `Invalid stock movement: quantityAfter (${data.quantityAfter.getValue()}) must equal ${expectedQuantityAfter}`,
      );
    }

    this.id = data.id;
    this.stockId = data.stockId;
    this.quantityBefore = data.quantityBefore;
    this.movement = data.movement;
    this.quantityAfter = data.quantityAfter;
    this.actionBy = data.actionBy;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
  }

  getId(): EntityId {
    return this.id;
  }

  getStockId(): EntityId {
    return this.stockId;
  }

  getQuantityBefore(): Quantity {
    return this.quantityBefore;
  }

  getMovement(): number {
    return this.movement;
  }

  getQuantityAfter(): Quantity {
    return this.quantityAfter;
  }

  getActionBy(): string {
    return this.actionBy;
  }

  getNotes(): string {
    return this.notes;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
