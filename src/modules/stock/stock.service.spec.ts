import { DataSource, Repository } from 'typeorm';
import { BatchBloodEntity } from '../batch/entities/batch-blood.entity';
import { BatchEntity } from '../batch/entities/batch.entity';
import { CompanyEntity } from '../company/entities/company.entity';
import { IllegalArgumentException } from '../shared/exceptions/illegal-argument.exception';
import { NoSuchElementException } from '../shared/exceptions/no-such-element.exception';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';
import { StockService } from './stock.service';

type RepoMock<T extends object> = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function createRepoMock<T extends object>(): RepoMock<T> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((payload: unknown) => payload),
    save: jest.fn(async (payload: unknown) => payload),
  };
}

describe('StockService', () => {
  let service: StockService;

  const stockRepository = createRepoMock<BloodstockEntity>();
  const companyRepository = createRepoMock<CompanyEntity>();
  const historyRepository = createRepoMock<BloodstockMovementEntity>();
  const batchRepository = createRepoMock<BatchEntity>();
  const batchBloodRepository = createRepoMock<BatchBloodEntity>();

  const managerStockRepository = createRepoMock<BloodstockEntity>();
  const managerCompanyRepository = createRepoMock<CompanyEntity>();
  const managerHistoryRepository = createRepoMock<BloodstockMovementEntity>();
  const managerBatchRepository = createRepoMock<BatchEntity>();
  const managerBatchBloodRepository = createRepoMock<BatchBloodEntity>();

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === CompanyEntity) return managerCompanyRepository;
      if (entity === BatchEntity) return managerBatchRepository;
      if (entity === BatchBloodEntity) return managerBatchBloodRepository;
      if (entity === BloodstockEntity) return managerStockRepository;
      if (entity === BloodstockMovementEntity) return managerHistoryRepository;
      throw new Error('Repository não mapeado no teste');
    }),
  };

  const dataSourceMock = {
    transaction: jest.fn(async (callback: (trxManager: typeof manager) => unknown) => callback(manager)),
  } as unknown as DataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StockService(
      dataSourceMock,
      stockRepository as unknown as Repository<BloodstockEntity>,
      companyRepository as unknown as Repository<CompanyEntity>,
      historyRepository as unknown as Repository<BloodstockMovementEntity>,
      batchRepository as unknown as Repository<BatchEntity>,
      batchBloodRepository as unknown as Repository<BatchBloodEntity>,
    );
  });

  it('deve atualizar estoque e registrar histórico em updateQuantity', async () => {
    const stock = {
      id: 'stock-1',
      quantity: 10,
      bloodType: 'A_POS',
    } as unknown as BloodstockEntity;

    (stockRepository.findOne as jest.Mock).mockResolvedValue(stock);

    const result = await service.updateQuantity('stock-1', 5);

    expect(result.quantity).toBe(15);
    expect(stockRepository.save).toHaveBeenCalled();
    expect(historyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quantityBefore: 10,
        quantityAfter: 15,
        movement: 5,
        notes: 'Ajuste manual',
      }),
    );
    expect(historyRepository.save).toHaveBeenCalled();
  });

  it('deve lançar InsufficientStockException quando update deixaria negativo', async () => {
    const stock = {
      id: 'stock-1',
      quantity: 2,
      bloodType: 'O_NEG',
    } as unknown as BloodstockEntity;

    (stockRepository.findOne as jest.Mock).mockResolvedValue(stock);

    await expect(service.updateQuantity('stock-1', -3)).rejects.toThrow(InsufficientStockException);
    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(historyRepository.save).not.toHaveBeenCalled();
  });

  it('deve executar processBatchEntry dentro de transação e persistir lote/histórico', async () => {
    const company = { id: 'company-1' } as CompanyEntity;
    const persistedBatch = {
      id: 'batch-1',
      batchCode: 'B-100',
      entryDate: '2026-03-10',
      company,
      bloodDetails: [],
    } as unknown as BatchEntity;

    (managerCompanyRepository.findOne as jest.Mock).mockResolvedValue(company);
    (managerBatchRepository.findOne as jest.Mock).mockResolvedValue(null);
    (managerBatchRepository.create as jest.Mock).mockReturnValue(persistedBatch);
    (managerBatchRepository.save as jest.Mock)
      .mockResolvedValueOnce(persistedBatch)
      .mockResolvedValueOnce(persistedBatch);
    (managerStockRepository.findOne as jest.Mock).mockResolvedValue(null);
    (managerStockRepository.create as jest.Mock).mockImplementation((payload) => payload);

    const result = await service.processBatchEntry('company-1', {
      batchCode: 'B-100',
      bloodQuantities: { A_POS: 10 },
      validateQuantities: () => [],
    } as any);

    expect(dataSourceMock.transaction).toHaveBeenCalled();
    expect(result).toBe(persistedBatch);
    expect(managerStockRepository.save).toHaveBeenCalled();
    expect(managerHistoryRepository.save).toHaveBeenCalled();
    expect(managerBatchRepository.save).toHaveBeenCalledTimes(2);
  });

  it('deve lançar NoSuchElementException em processBatchEntry sem empresa', async () => {
    (managerCompanyRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.processBatchEntry('company-x', {
        batchCode: 'B-100',
        bloodQuantities: { A_POS: 1 },
        validateQuantities: () => [],
      } as any),
    ).rejects.toThrow(NoSuchElementException);
  });

  it('deve lançar IllegalArgumentException quando saída em lote excede quantidade do lote', async () => {
    const batch = {
      id: 'batch-1',
      batchCode: 'B-1',
      bloodDetails: [{ bloodType: 'A_POS', quantity: 1 }],
    } as unknown as BatchEntity;

    (managerBatchRepository.findOne as jest.Mock).mockResolvedValue(batch);
    (managerCompanyRepository.findOne as jest.Mock).mockResolvedValue({ id: 'company-1' });

    await expect(
      service.processBulkBatchExit('company-1', {
        batchId: 'batch-1',
        quantities: { A_POS: 2 },
      }),
    ).rejects.toThrow(IllegalArgumentException);
  });

  it('deve executar saída em lote com sucesso e registrar histórico em transação', async () => {
    const batch = {
      id: 'batch-1',
      batchCode: 'B-1',
      bloodDetails: [{ bloodType: 'A_POS', quantity: 5 }],
    } as unknown as BatchEntity;

    const company = { id: 'company-1' } as CompanyEntity;
    const stock = {
      id: 'stock-1',
      quantity: 8,
      bloodType: 'A_POS',
      company,
    } as unknown as BloodstockEntity;

    (managerBatchRepository.findOne as jest.Mock).mockResolvedValue(batch);
    (managerCompanyRepository.findOne as jest.Mock).mockResolvedValue(company);
    (managerStockRepository.findOne as jest.Mock).mockResolvedValue(stock);
    (managerBatchRepository.save as jest.Mock).mockResolvedValue(batch);

    const result = await service.processBulkBatchExit('company-1', {
      batchId: 'batch-1',
      quantities: { A_POS: 3 },
    });

    expect(dataSourceMock.transaction).toHaveBeenCalled();
    expect(result).toBe(batch);
    expect((batch.bloodDetails[0] as { quantity: number }).quantity).toBe(2);
    expect((stock as { quantity: number }).quantity).toBe(5);
    expect(managerStockRepository.save).toHaveBeenCalled();
    expect(managerHistoryRepository.save).toHaveBeenCalled();
    expect(managerBatchRepository.save).toHaveBeenCalledWith(batch);
  });

  it('deve lançar erro quando saída em lote gera estoque negativo', async () => {
    const batch = {
      id: 'batch-1',
      batchCode: 'B-1',
      bloodDetails: [{ bloodType: 'O_NEG', quantity: 4 }],
    } as unknown as BatchEntity;

    const company = { id: 'company-1' } as CompanyEntity;
    const stock = {
      id: 'stock-2',
      quantity: 1,
      bloodType: 'O_NEG',
      company,
    } as unknown as BloodstockEntity;

    (managerBatchRepository.findOne as jest.Mock).mockResolvedValue(batch);
    (managerCompanyRepository.findOne as jest.Mock).mockResolvedValue(company);
    (managerStockRepository.findOne as jest.Mock).mockResolvedValue(stock);

    await expect(
      service.processBulkBatchExit('company-1', {
        batchId: 'batch-1',
        quantities: { O_NEG: 2 },
      }),
    ).rejects.toThrow(new IllegalArgumentException('Resultado inválido: estoque negativo'));

    expect(managerStockRepository.save).not.toHaveBeenCalled();
    expect(managerHistoryRepository.save).not.toHaveBeenCalled();
  });

  it('deve consultar histórico ordenado por updateDate desc', async () => {
    (historyRepository.find as jest.Mock).mockResolvedValue([]);

    await service.getHistoryByBloodstockId('stock-10');

    expect(historyRepository.find).toHaveBeenCalledWith({
      where: { bloodstock: { id: 'stock-10' } },
      relations: { bloodstock: true },
      order: { updateDate: 'DESC' },
    });
  });
});