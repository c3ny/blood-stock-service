import { StockMovement } from '../../src/domain/entities/stock-movement.entity';
import { InvalidStockMovementError } from '../../src/domain/errors/invalid-stock-movement.error';
import { EntityId } from '../../src/domain/value-objects/entity-id.vo';
import { Quantity } from '../../src/domain/value-objects/quantity.vo';

describe('StockMovement Entity', () => {
  it('should create valid movement with consistent quantities', () => {
    const stockId = new EntityId();
    const movement = new StockMovement({
      id: new EntityId(),
      stockId,
      quantityBefore: new Quantity(10),
      movement: -2,
      quantityAfter: new Quantity(8),
      actionBy: 'user@example.com',
      notes: 'Blood donation taken',
      createdAt: new Date(),
    });

    expect(movement.getQuantityAfter().getValue()).toBe(8);
    expect(movement.getActionBy()).toBe('user@example.com');
  });

  it('should reject inconsistent before/after quantities', () => {
    expect(() =>
      new StockMovement({
        id: new EntityId(),
        stockId: new EntityId(),
        quantityBefore: new Quantity(5),
        movement: 3,
        quantityAfter: new Quantity(7),
        actionBy: 'system',
        notes: 'Invalid movement',
        createdAt: new Date(),
      })
    ).toThrow(InvalidStockMovementError);
  });
});
