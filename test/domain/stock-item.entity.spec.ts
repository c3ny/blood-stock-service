import { StockItem } from '../../src/domain/entities/stock-item.entity';
import { BloodType } from '../../src/domain/value-objects/blood-type.vo';
import { EntityId } from '../../src/domain/value-objects/entity-id.vo';
import { Quantity } from '../../src/domain/value-objects/quantity.vo';
import { InsufficientStockError } from '../../src/domain/errors/insufficient-stock.error';

describe('StockItem Entity', () => {
  it('should adjust stock with positive movement', () => {
    const stock = StockItem.create(
      new EntityId(),
      new EntityId(),
      BloodType.fromString('O+'),
      new Quantity(10),
      new Quantity(5),
      new Quantity(3),
      new Quantity(2),
    );

    stock.adjustBy(5);

    expect(stock.getQuantityO().getValue()).toBe(7);
  });

  it('should throw when movement makes stock negative', () => {
    const stock = StockItem.create(
      new EntityId(),
      new EntityId(),
      BloodType.fromString('A-'),
      new Quantity(0),
      new Quantity(0),
      new Quantity(0),
      new Quantity(2),
    );

    expect(() => stock.adjustBy(-3)).toThrow(InsufficientStockError);
  });
});
