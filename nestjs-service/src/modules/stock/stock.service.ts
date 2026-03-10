import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BatchBloodEntity } from '../batch/entities/batch-blood.entity';
import { BatchEntity } from '../batch/entities/batch.entity';
import { BloodType } from '../batch/entities/blood-type.enum';
import { CompanyEntity } from '../company/entities/company.entity';
import { BatchEntryRequestDto } from './dto/batch-entry-request.dto';
import { BatchExitBulkRequestDto } from './dto/batch-exit-bulk-request.dto';
import { CreateBloodstockDto } from './dto/create-bloodstock.dto';
import { IllegalArgumentException } from '../shared/exceptions/illegal-argument.exception';
import { NoSuchElementException } from '../shared/exceptions/no-such-element.exception';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';

@Injectable()
export class StockService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BloodstockEntity)
    private readonly stockRepository: Repository<BloodstockEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(BloodstockMovementEntity)
    private readonly historyRepository: Repository<BloodstockMovementEntity>,
    @InjectRepository(BatchEntity)
    private readonly batchRepository: Repository<BatchEntity>,
    @InjectRepository(BatchBloodEntity)
    private readonly batchBloodRepository: Repository<BatchBloodEntity>,
  ) {}

  async save(stockDto: CreateBloodstockDto, companyId: string): Promise<BloodstockEntity> {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NoSuchElementException('Empresa não encontrada');
    }

    const stock = this.stockRepository.create({
      bloodType: stockDto.bloodType,
      quantity: stockDto.quantity ?? 0,
      company,
    });

    return this.stockRepository.save(stock);
  }

  listAll(): Promise<BloodstockEntity[]> {
    return this.stockRepository.find();
  }

  findByCompany(companyId: string): Promise<BloodstockEntity[]> {
    return this.stockRepository.find({
      where: { company: { id: companyId } },
    });
  }

  async updateQuantity(id: string, movement: number): Promise<BloodstockEntity> {
    const stock = await this.stockRepository.findOne({ where: { id } });
    if (!stock) {
      throw new NoSuchElementException('Estoque não encontrado');
    }

    const current = stock.quantity;
    const updated = current + movement;

    if (updated < 0) {
      throw new InsufficientStockException('Estoque insuficiente');
    }

    stock.quantity = updated;
    await this.stockRepository.save(stock);

    const history = this.historyRepository.create({
      bloodstock: stock,
      quantityBefore: current,
      quantityAfter: updated,
      movement,
      actionDate: new Date(),
      actionBy: 'system',
      notes: 'Ajuste manual',
    });
    await this.historyRepository.save(history);

    return stock;
  }

  async processBatchEntry(companyId: string, dto: BatchEntryRequestDto): Promise<BatchEntity> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepository = manager.getRepository(CompanyEntity);
      const batchRepository = manager.getRepository(BatchEntity);
      const batchBloodRepository = manager.getRepository(BatchBloodEntity);
      const stockRepository = manager.getRepository(BloodstockEntity);
      const historyRepository = manager.getRepository(BloodstockMovementEntity);

      const company = await companyRepository.findOne({ where: { id: companyId } });
      if (!company) {
        throw new NoSuchElementException('Empresa não encontrada');
      }

      let batch = await batchRepository.findOne({
        where: { batchCode: dto.batchCode, company: { id: companyId } },
        relations: { bloodDetails: true },
      });

      if (!batch) {
        batch = batchRepository.create({
          company,
          batchCode: dto.batchCode,
          entryDate: new Date().toISOString().slice(0, 10),
          bloodDetails: [],
        });
        batch = await batchRepository.save(batch);
      }

      for (const [bloodType, qty] of Object.entries(dto.bloodQuantities ?? {})) {
        if (qty <= 0) {
          continue;
        }

        const type = bloodType as BloodType;

        let existing = batch.bloodDetails.find((item) => item.bloodType === type);
        if (existing) {
          existing.quantity += qty;
        } else {
          existing = batchBloodRepository.create({
            batch,
            bloodType: type,
            quantity: qty,
          });
          batch.bloodDetails.push(existing);
        }

        let stock = await stockRepository.findOne({
          where: { company: { id: companyId }, bloodType: type },
        });

        if (!stock) {
          stock = stockRepository.create({
            company,
            bloodType: type,
            quantity: 0,
          });
        }

        const oldQty = stock.quantity;
        const newQty = oldQty + qty;
        stock.quantity = newQty;
        await stockRepository.save(stock);

        const history = historyRepository.create({
          bloodstock: stock,
          movement: qty,
          quantityBefore: oldQty,
          quantityAfter: newQty,
          actionBy: 'system',
          notes: `Entrada em lote: ${dto.batchCode}`,
          actionDate: new Date(),
        });
        await historyRepository.save(history);
      }

      return batchRepository.save(batch);
    });
  }

  async processBulkBatchExit(companyId: string, dto: BatchExitBulkRequestDto): Promise<BatchEntity> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepository = manager.getRepository(CompanyEntity);
      const batchRepository = manager.getRepository(BatchEntity);
      const stockRepository = manager.getRepository(BloodstockEntity);
      const historyRepository = manager.getRepository(BloodstockMovementEntity);

      const batch = await batchRepository.findOne({
        where: { id: dto.batchId },
        relations: { bloodDetails: true },
      });
      if (!batch) {
        throw new NoSuchElementException('Lote não encontrado');
      }

      const company = await companyRepository.findOne({ where: { id: companyId } });
      if (!company) {
        throw new NoSuchElementException('Empresa não encontrada');
      }

      for (const [bloodType, qtyToRemove] of Object.entries(dto.quantities ?? {})) {
        const type = bloodType as BloodType;
        const qty = qtyToRemove;

        if (qty <= 0) {
          continue;
        }

        const entry = batch.bloodDetails.find((item) => item.bloodType === type);
        if (!entry) {
          throw new IllegalArgumentException('Tipo sanguíneo inexistente no lote');
        }
        if (entry.quantity < qty) {
          throw new IllegalArgumentException('Quantidade insuficiente no lote');
        }

        entry.quantity -= qty;

        let stock = await stockRepository.findOne({
          where: { company: { id: companyId }, bloodType: type },
        });
        if (!stock) {
          stock = stockRepository.create({
            company,
            bloodType: type,
            quantity: 0,
          });
        }

        const oldStockQty = stock.quantity;
        const newStockQty = oldStockQty - qty;
        if (newStockQty < 0) {
          throw new IllegalArgumentException('Resultado inválido: estoque negativo');
        }

        stock.quantity = newStockQty;
        await stockRepository.save(stock);

        const history = historyRepository.create({
          bloodstock: stock,
          movement: qty * -1,
          quantityBefore: oldStockQty,
          quantityAfter: newStockQty,
          actionBy: 'system',
          notes: `Saída por lote: ${batch.batchCode}`,
          actionDate: new Date(),
        });
        await historyRepository.save(history);
      }

      return batchRepository.save(batch);
    });
  }

  getHistoryByBloodstockId(bloodstockId: string): Promise<BloodstockMovementEntity[]> {
    return this.historyRepository.find({
      where: { bloodstock: { id: bloodstockId } },
      relations: { bloodstock: true },
      order: { updateDate: 'DESC' },
    });
  }
}