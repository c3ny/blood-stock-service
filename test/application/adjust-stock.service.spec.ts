import { EntityId } from '../../src/domain/value-objects/entity-id.vo';
import { InsufficientStockError } from '../../src/domain/errors/insufficient-stock.error';
import { AdjustStockService } from '../../src/application/stock/use-cases/adjust-stock/adjust-stock.service';
import { AdjustStockCommand } from '../../src/application/stock/use-cases';
import { StockRepositoryPort } from '../../src/application/stock/ports/out/stock-repository.port';
import { IdGeneratorPort } from '../../src/application/stock/ports/out/id-generator.port';
import { DateProviderPort } from '../../src/application/stock/ports/out/date-provider.port';

describe('AdjustStockService', () => {
  const stockId = new EntityId();
  const companyId = new EntityId();

  const stockRepositoryMock: jest.Mocked<StockRepositoryPort> = {
    findById: jest.fn(),
    findReadById: jest.fn(),
    findMany: jest.fn(),
    adjustAtomically: jest.fn(),
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
    stockRepositoryMock.adjustAtomically.mockResolvedValue({
      stockId: stockId.getValue(),
      companyId: companyId.getValue(),
      bloodType: 'O+',
      quantityABefore: 0,
      quantityBBefore: 0,
      quantityABBefore: 0,
      quantityOBefore: 10,
      quantityAAfter: 0,
      quantityBAfter: 0,
      quantityABAfter: 0,
      quantityOAfter: 6,
      timestamp: new Date('2026-02-27T10:30:00.000Z'),
    });

    const service = new AdjustStockService(
      stockRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand(stockId.getValue(), -4, 'tester', 'manual adjustment');
    const result = await service.execute(command);

    expect(result.quantityOBefore).toBe(10);
    expect(result.quantityOAfter).toBe(6);
    expect(stockRepositoryMock.adjustAtomically).toHaveBeenCalledTimes(1);
  });

  it('should throw error when stock does not exist', async () => {
    stockRepositoryMock.adjustAtomically.mockRejectedValue(new Error('Stock not found with ID: non-existent-id'));

    const service = new AdjustStockService(
      stockRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand('non-existent-id', 2, 'tester', 'test');
    await expect(service.execute(command)).rejects.toThrow('Stock not found');

    expect(stockRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('should throw InsufficientStockError when movement makes stock negative', async () => {
    stockRepositoryMock.adjustAtomically.mockRejectedValue(
      new InsufficientStockError(stockId.getValue(), 5, 1),
    );

    const service = new AdjustStockService(
      stockRepositoryMock,
      idGeneratorMock,
      dateProviderMock,
    );

    const command = new AdjustStockCommand(stockId.getValue(), -5, 'tester', 'test');
    await expect(service.execute(command)).rejects.toThrow(InsufficientStockError);

    expect(stockRepositoryMock.save).not.toHaveBeenCalled();
  });
});
