import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

/**
 * Suite de testes unitários do StockController,
 * validando mapeamentos de contrato legado e respostas HTTP esperadas.
 */
describe('StockController', () => {
  let controller: StockController;

  const stockServiceMock = {
    save: jest.fn(),
    listAll: jest.fn(),
    updateQuantity: jest.fn(),
    processBatchEntry: jest.fn(),
    processBulkBatchExit: jest.fn(),
    findByCompany: jest.fn(),
    getHistoryByBloodstockId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: stockServiceMock,
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    jest.clearAllMocks();
  });

  it('deve mapear retorno create para snake_case legado', async () => {
    stockServiceMock.save.mockResolvedValue({
      id: '1',
      bloodType: 'A_POS',
      updateDate: '2026-03-10',
      quantity: 10,
      company: { id: 'c1' },
    });

    const result = await controller.createWithCompany(
      { bloodType: 'A_POS' as never, quantity: 10 },
      'company-id',
    );

    expect(result).toEqual({
      id: '1',
      blood_type: 'A_POS',
      update_date: '2026-03-10',
      quantity: 10,
    });
    expect((result as unknown as { company?: unknown }).company).toBeUndefined();
  });

  it('deve mapear listagem para snake_case legado', async () => {
    stockServiceMock.listAll.mockResolvedValue([
      {
        id: '1',
        bloodType: 'O_NEG',
        updateDate: '2026-03-10',
        quantity: 4,
      },
    ]);

    const result = await controller.listAll();

    expect(result).toEqual([
      {
        id: '1',
        blood_type: 'O_NEG',
        update_date: '2026-03-10',
        quantity: 4,
      },
    ]);
  });

  it('deve retornar 400 com lista vazia quando companyId é inválido', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.getStockByCompany('id-invalido', response as never);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith([]);
    expect(stockServiceMock.findByCompany).not.toHaveBeenCalled();
  });

  it('deve retornar 200 e item mapeado em movement quando sucesso', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    stockServiceMock.updateQuantity.mockResolvedValue({
      id: '10',
      bloodType: 'AB_NEG',
      updateDate: '2026-03-10',
      quantity: 20,
    });

    await controller.moveStock(
      'company-id',
      { bloodstockId: 'stock-id', quantity: 5 },
      response as never,
    );

    expect(stockServiceMock.updateQuantity).toHaveBeenCalledWith('stock-id', 5);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: '10',
      blood_type: 'AB_NEG',
      update_date: '2026-03-10',
      quantity: 20,
    });
  });

  it('deve retornar 500 em movement quando serviço falha', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    stockServiceMock.updateQuantity.mockRejectedValue(new Error('falha'));

    await controller.moveStock(
      'company-id',
      { bloodstockId: 'stock-id', quantity: 5 },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalled();
  });

  it('deve retornar 400 em batch-entry quando mapa tem quantidade inválida', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.batchEntry(
      'company-id',
      {
        batchCode: 'B-001',
        bloodQuantities: { A_POS: -1 },
        validateQuantities: () => ['A_POS: A quantidade deve ser positiva ou zero'],
      },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(['A_POS: A quantidade deve ser positiva ou zero']);
    expect(stockServiceMock.processBatchEntry).not.toHaveBeenCalled();
  });

  it('deve retornar 201 em batch-entry com payload mapeado', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    stockServiceMock.processBatchEntry.mockResolvedValue({
      id: 'batch-1',
      batchCode: 'B-001',
      entryDate: '2026-03-10',
      bloodDetails: [
        {
          id: 'detail-1',
          bloodType: 'A_POS',
          quantity: 15,
        },
      ],
    });

    await controller.batchEntry(
      'company-id',
      {
        batchCode: 'B-001',
        bloodQuantities: { A_POS: 15 },
        validateQuantities: () => [],
      },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: 'batch-1',
        batchCode: 'B-001',
        entryDate: '2026-03-10',
        bloodDetails: [
          {
            id: 'detail-1',
            bloodType: 'A_POS',
            quantity: 15,
          },
        ],
      },
    ]);
  });

  it('deve retornar 500 em batch-entry quando serviço falha', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    stockServiceMock.processBatchEntry.mockRejectedValue(new Error('falha'));

    await controller.batchEntry(
      'company-id',
      {
        batchCode: 'B-001',
        bloodQuantities: { A_POS: 10 },
        validateQuantities: () => [],
      },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalled();
  });

  it('deve retornar 200 em batch-exit/bulk com estoque mapeado', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    stockServiceMock.processBulkBatchExit.mockResolvedValue({ id: 'batch-1' });
    stockServiceMock.findByCompany.mockResolvedValue([
      {
        id: 'stock-1',
        bloodType: 'O_POS',
        updateDate: '2026-03-10',
        quantity: 8,
      },
    ]);

    await controller.processBulkExit(
      'company-id',
      { batchId: '3ec466cb-04ad-43cb-b3f5-f6cb3fc3c3ce', quantities: { O_POS: 2 } },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: 'stock-1',
        blood_type: 'O_POS',
        update_date: '2026-03-10',
        quantity: 8,
      },
    ]);
  });

  it('deve retornar 400 em batch-exit/bulk quando serviço lança erro', async () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    stockServiceMock.processBulkBatchExit.mockRejectedValue(
      new Error('Quantidade insuficiente no lote'),
    );

    await controller.processBulkExit(
      'company-id',
      { batchId: '3ec466cb-04ad-43cb-b3f5-f6cb3fc3c3ce', quantities: { O_POS: 999 } },
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith('Quantidade insuficiente no lote');
  });

  it('deve mapear updateQuantity para contrato legado snake_case', async () => {
    stockServiceMock.updateQuantity.mockResolvedValue({
      id: 'stock-22',
      bloodType: 'B_POS',
      updateDate: '2026-03-10',
      quantity: 99,
    });

    const result = await controller.updateQuantity('stock-22', 9);

    expect(stockServiceMock.updateQuantity).toHaveBeenCalledWith('stock-22', 9);
    expect(result).toEqual({
      id: 'stock-22',
      blood_type: 'B_POS',
      update_date: '2026-03-10',
      quantity: 99,
    });
  });

  it('deve delegar histórico para o serviço', async () => {
    stockServiceMock.getHistoryByBloodstockId.mockResolvedValue([{ id: 'h1' }]);

    const result = await controller.getHistory('stock-30');

    expect(stockServiceMock.getHistoryByBloodstockId).toHaveBeenCalledWith('stock-30');
    expect(result).toEqual([{ id: 'h1' }]);
  });

  it('deve gerar CSV com cabeçalho e linhas de estoque no report', async () => {
    stockServiceMock.findByCompany.mockResolvedValue([
      {
        id: 's1',
        bloodType: 'A_NEG',
        quantity: 3,
        updateDate: '2026-03-10',
      },
      {
        id: 's2',
        bloodType: 'O_POS',
        quantity: 7,
        updateDate: '2026-03-10',
      },
    ]);

    const response = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    await controller.generateReport('company-1', response as never);

    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="bloodstock_report.csv"',
    );
    expect(response.write).toHaveBeenNthCalledWith(1, 'Blood Type,Quantity,Date\n');
    expect(response.write).toHaveBeenNthCalledWith(2, 'A_NEG,3,2026-03-10\n');
    expect(response.write).toHaveBeenNthCalledWith(3, 'O_POS,7,2026-03-10\n');
    expect(response.end).toHaveBeenCalled();
  });
});