import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { StockController } from '../../../src/modules/stock/stock.controller';
import { StockService } from '../../../src/modules/stock/stock.service';
import { JwtAuthGuard } from '../../../src/modules/shared/auth/jwt-auth.guard';
import { RequireCompanyGuard } from '../../../src/modules/shared/auth/require-company.guard';
import { InternalSecretGuard } from '../../../src/modules/shared/auth/internal-secret.guard';

import request = require('supertest');

describe('StockController', () => {
  let app: INestApplication;

  const stockServiceMock = {
    findByCompany: async () => [{ id: 's1', bloodType: 'A+', quantity: 10 }],
    processBatchEntry: async () => ({ id: 'b1' }),
    getAvailableBatchesByBloodType: async () => [{ id: 'bb1' }],
    processBatchExit: async () => undefined,
    getHistoryByCompany: async () => [{ id: 'm1', movement: 5 }],
    initializeCompanyStock: async () => undefined,
  };

  const injectUser: CanActivate = {
    canActivate: (ctx: ExecutionContext) => {
      ctx.switchToHttp().getRequest().user = { companyId: 'c1' };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: stockServiceMock }],
    })
      .overrideGuard(JwtAuthGuard).useValue(injectUser)
      .overrideGuard(RequireCompanyGuard).useValue(injectUser)
      .overrideGuard(InternalSecretGuard).useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/stock should return 200', async () => {

    // Arrange
    const server = app.getHttpServer();

    // Act
    const res = await request(server).get('/api/stock');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 's1', bloodType: 'A+', quantity: 10 }]);
  });

  it('POST /api/stock/batchEntry should return 201', async () => {

    // Arrange
    const server = app.getHttpServer();
    const dto = { batchCode: 'L1', entryDate: '01/01/2026', expiryDate: '01/06/2026', bloodQuantities: { 'A+': 5 } };

    // Act
    const res = await request(server).post('/api/stock/batchEntry').send(dto);

    // Assert
    expect(res.status).toBe(201);
  });

  it('GET /api/stock/batches/:bloodType should return 200', async () => {

    // Arrange
    const server = app.getHttpServer();

    // Act
    const res = await request(server).get('/api/stock/batches/A+');

    // Assert
    expect(res.status).toBe(200);
  });

  it('POST /api/stock/batchExit should return 200', async () => {

    // Arrange
    const server = app.getHttpServer();
    const dto = { quantities: { 'A+': 2 }, exitDate: '10/01/2026' };

    // Act
    const res = await request(server).post('/api/stock/batchExit').send(dto);

    // Assert
    expect(res.status).toBe(200);
  });

  it('GET /api/stock/history should return 200', async () => {

    // Arrange
    const server = app.getHttpServer();

    // Act
    const res = await request(server).get('/api/stock/history');

    // Assert
    expect(res.status).toBe(200);
  });

  it('GET /api/stock/report should return CSV', async () => {

    // Arrange
    const server = app.getHttpServer();

    // Act
    const res = await request(server).get('/api/stock/report');

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('POST /api/stock/init should return 201', async () => {

    // Arrange
    const server = app.getHttpServer();
    const dto = { companyId: 'c1', cnpj: '00000000000000', cnes: '1234567', institutionName: 'X' };

    // Act
    const res = await request(server).post('/api/stock/init').send(dto);

    // Assert
    expect(res.status).toBe(201);
  });
});
