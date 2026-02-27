import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  ADJUST_STOCK_USE_CASE,
  GET_STOCK_BY_ID_USE_CASE,
  GET_STOCK_MOVEMENTS_USE_CASE,
  LIST_STOCKS_USE_CASE,
  STOCK_MOVEMENT_REPOSITORY_PORT,
  STOCK_REPOSITORY_PORT,
} from '../src/application/stock/ports';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/adapters/out/persistence/prisma/prisma.service';

describe('API E2E', () => {
  let app: INestApplication;

  const listStocksUseCaseMock = {
    execute: jest.fn().mockResolvedValue({
      items: [
        {
          id: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
          companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
          bloodType: 'O+',
          quantityA: 0,
          quantityB: 0,
          quantityAB: 0,
          quantityO: 100,
          createdAt: new Date('2026-02-27T19:17:56.000Z'),
          updatedAt: new Date('2026-02-27T19:17:56.000Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    }),
  };

  const getStockByIdUseCaseMock = {
    execute: jest.fn().mockResolvedValue({
      id: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
      companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
      bloodType: 'O+',
      quantityA: 0,
      quantityB: 0,
      quantityAB: 0,
      quantityO: 100,
      createdAt: new Date('2026-02-27T19:17:56.000Z'),
      updatedAt: new Date('2026-02-27T19:17:56.000Z'),
    }),
  };

  const getStockMovementsUseCaseMock = {
    execute: jest.fn().mockResolvedValue({
      items: [
        {
          id: 'abc123-def456-ghi789',
          stockId: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
          movement: 10,
          quantityBefore: 100,
          quantityAfter: 110,
          actionBy: 'admin@bloodstock.com',
          notes: 'Doação de sangue de campanha empresarial',
          createdAt: new Date('2026-02-27T19:17:56.000Z'),
        },
      ],
      total: 1,
    }),
  };

  const adjustStockUseCaseMock = {
    execute: jest.fn().mockResolvedValue({
      stockId: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
      companyId: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
      bloodType: 'O+',
      quantityABefore: 0,
      quantityBBefore: 0,
      quantityABBefore: 0,
      quantityOBefore: 100,
      quantityAAfter: 0,
      quantityBAfter: 0,
      quantityABAfter: 0,
      quantityOAfter: 110,
      timestamp: new Date('2026-02-27T19:17:56.000Z'),
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LIST_STOCKS_USE_CASE)
      .useValue(listStocksUseCaseMock)
      .overrideProvider(GET_STOCK_BY_ID_USE_CASE)
      .useValue(getStockByIdUseCaseMock)
      .overrideProvider(GET_STOCK_MOVEMENTS_USE_CASE)
      .useValue(getStockMovementsUseCaseMock)
      .overrideProvider(ADJUST_STOCK_USE_CASE)
      .useValue(adjustStockUseCaseMock)
      .overrideProvider(STOCK_REPOSITORY_PORT)
      .useValue({
        findById: jest.fn(),
        findReadById: jest.fn(),
        findMany: jest.fn(),
        adjustAtomically: jest.fn(),
        save: jest.fn(),
      })
      .overrideProvider(STOCK_MOVEMENT_REPOSITORY_PORT)
      .useValue({
        save: jest.fn(),
        findByStockId: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/stocks', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/stocks').expect(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/v1/stocks/:stockId', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae')
      .expect(200);

    expect(res.body.id).toBe('26f6de4c-3e38-46ad-a9da-5d1e6bb663ae');
  });

  it('GET /api/v1/stocks/:stockId/movements', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/movements')
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].movement).toBe(10);
  });

  it('PATCH /api/v1/stocks/:stockId/adjust', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae/adjust')
      .send({
        movement: 10,
        actionBy: 'admin@bloodstock.com',
        notes: 'Doação',
      })
      .expect(200);

    expect(res.body.quantityOAfter).toBe(110);
  });

  it('GET /api/v1/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('healthy');
  });
});
