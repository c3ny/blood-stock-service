import { StockItem } from '../../src/domain/entities/stock-item.entity';
import { BloodType } from '../../src/domain/value-objects/blood-type.vo';
import { EntityId } from '../../src/domain/value-objects/entity-id.vo';
import { Quantity } from '../../src/domain/value-objects/quantity.vo';
import { InsufficientStockError } from '../../src/domain/errors/insufficient-stock.error';
import { AdjustStockService } from '../../src/application/stock/use-cases/adjust-stock/adjust-stock.service';
import { AdjustStockCommand } from '../../src/application/stock/ports/in/adjust-stock.use-case';
import { StockRepositoryPort } from '../../src/application/stock/ports/out/stock-repository.port';
import { StockMovementRepositoryPort } from '../../src/application/stock/ports/out/stock-movement-repository.port';
import { IdGeneratorPort } from '../../src/application/stock/ports/out/id-generator.port';
import { DateProviderPort } from '../../src/application/stock/ports/out/date-provider.port';

describe('AdjustStockService', () => {
  const stockId = new EntityId();
  const companyId = new EntityId();

  const buildStock = (initialQuantity: number): StockItem =>
    StockItem.create(
      stockId,
      companyId,
      BloodType.fromString('O+'),
      new Quantity(0),
      new Quantity(0),
      new Quantity(0),
      new Quantity(initialQuantity),
    );

  const stockRepositoryMock: jest.Mocked<StockRepositoryPort> = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  const movementRepositoryMock: jest.Mocked<StockMovementRepositoryPort> = {
    save: jest.fn(),
  };

  const idGeneratorMock: jest.Mocked<IdGeneratorPort> = {
    generate: jest.fn(),
  };

  const dateProviderMock: jest.Mocked<DateProviderPort> = {
    now: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    idGeneratorMock.generate.mockReturnValue('6e34d121-2d1a-4b04-b11b-7c633f8970e0');
    dateProviderMock.now.mockReturnValue(new Date('2026-02-27T10:30:00.000Z'));
  });

  it('should adjust stock and persist movement', async () => {
    stockRepositoryMock.findById.mockResolvedValue(buildStock(10));

    const service = new AdjustStockService(
      stockRepositoryMock,
      movementRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand(stockId.getValue(), -4, 'tester', 'manual adjustment');
    const result = await service.execute(command);

    expect(result.quantityOBefore).toBe(10);
    expect(result.quantityOAfter).toBe(6);
    expect(stockRepositoryMock.save).toHaveBeenCalledTimes(1);
    expect(movementRepositoryMock.save).toHaveBeenCalledTimes(1);
  });

  it('should throw error when stock does not exist', async () => {
    stockRepositoryMock.findById.mockResolvedValue(null);

    const service = new AdjustStockService(
      stockRepositoryMock,
      movementRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand('non-existent-id', 2, 'tester', 'test');
    await expect(service.execute(command)).rejects.toThrow('Stock not found');

    expect(stockRepositoryMock.save).not.toHaveBeenCalled();
    expect(movementRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('should throw InsufficientStockError when movement makes stock negative', async () => {
    stockRepositoryMock.findById.mockResolvedValue(buildStock(1));

    const service = new AdjustStockService(
      stockRepositoryMock,
      movementRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand(stockId.getValue(), -5, 'tester', 'test');
    await expect(service.execute(command)).rejects.toThrow(InsufficientStockError);

    expect(stockRepositoryMock.save).not.toHaveBeenCalled();
    expect(movementRepositoryMock.save).not.toHaveBeenCalled();
  });
});
