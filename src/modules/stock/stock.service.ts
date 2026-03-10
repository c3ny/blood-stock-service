import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BatchBloodEntity } from '../batch/entities/batch-blood.entity';
import { BatchEntity } from '../batch/entities/batch.entity';
import { BloodType } from '../batch/entities/blood-type.enum';
import { CompanyEntity } from '../company/entities/company.entity';
import { BatchEntryRequestDto } from './dto/request/batch-entry-request.dto';
import { BatchExitRequestDto } from './dto/request/batch-exit-request.dto';
import { IllegalArgumentException } from '../shared/errors/exceptions/illegal-argument.exception';
import { NoSuchElementException } from '../shared/errors/exceptions/no-such-element.exception';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import { BloodstockMovementEntity } from './entities/bloodstock-movement.entity';
import { BloodstockEntity } from './entities/bloodstock.entity';

/**
 * Serviço de regras de negócio do estoque de sangue.
 * Centraliza operações de consulta, ajuste manual e processamento por lote.
 */
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
  ) {}


  /**
   * Busca todos os itens de estoque de uma empresa específica.
   */
  findByCompany(companyId: string): Promise<BloodstockEntity[]> {
    return this.stockRepository.find({
      where: { company: { id: companyId } },
    });
  }

  /**
   * Atualiza a quantidade de um item de estoque e registra histórico da movimentação.
   */
  async updateQuantity(userId: string, batchCode: string, movement: number): Promise<BloodstockEntity> {
    const stock = await this.stockRepository.findOne({ where: { batchCode } });
    const company = await this.companyRepository.findOne({ where: { id: userId } });
    if (!stock) {
      throw new NoSuchElementException('Estoque não encontrado');
    }

    const current = stock.quantity;
    const updated = current + movement;
    const actionBy = company?.fkUserId

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
      actionBy,
    });
    await this.historyRepository.save(history);

    return stock;
  }

  /**
   * Processa entrada em lote de múltiplos tipos sanguíneos.
   * Executa em transação para garantir consistência entre lote, estoque e histórico.
   */
  async processBatchEntry(userId: string, companyId: string, dto: BatchEntryRequestDto): Promise<BatchEntity> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepository = manager.getRepository(CompanyEntity);
      const batchRepository = manager.getRepository(BatchEntity);
      const batchBloodRepository = manager.getRepository(BatchBloodEntity);
      const stockRepository = manager.getRepository(BloodstockEntity);
      const historyRepository = manager.getRepository(BloodstockMovementEntity);

      const company = await companyRepository.findOne({ where: { id: companyId, fkUserId: userId } });
      if (!company || company.fkUserId !== userId) {
        throw new NoSuchElementException('Empresa não encontrada, ou usuário sem permissão');
      }

      let batch = await batchRepository.findOne({
        where: { batchCode: dto.batchCode, company: { id: companyId } },
        relations: { bloodDetails: true },
      });

      if (!batch) {
        batch = batchRepository.create({
          company,
          batchCode: dto.batchCode,
          entryDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
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
        if (existing ) {
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

       
        /*
        Validação de consistência do estoque base por tipo sanguíneo durante a entrada de lote.
        Mesmo com a regra de negócio de pré-inicialização (todos os tipos com quantidade 0), 
        a checagem if (!stock) permanece como proteção contra dados incompletos/inconsistentes no banco.
        Se o registro não existir, a operação é interrompida com NoSuchElementException,
         evitando atualização incorreta e mantendo integridade transacional.
        */
        if (!stock) {
        throw new NoSuchElementException(
          `Estoque base não inicializado para ${type} na empresa ${companyId}`,
        );
        }

        const oldQty = stock.quantity;
        const newQty = oldQty + qty;
        stock.quantity = newQty;
        await stockRepository.save(stock);
        const actionBy = company?.fkUserId

        const history = historyRepository.create({
          bloodstock: stock,
          movement: qty,
          quantityBefore: oldQty,
          quantityAfter: newQty,
          actionBy: actionBy,
          notes: `Entrada em lote: ${dto.batchCode}`,
          actionDate: new Date(),
        });
        await historyRepository.save(history);
      }

      return batchRepository.save(batch);
    });
  }

  /**
   * Processa saída em lote para múltiplos tipos sanguíneos.
   * Valida quantidades e impede geração de saldo negativo.
   */
  async processBatchExit(userId: string, companyId: string, dto: BatchExitRequestDto): Promise<BatchEntity> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepository = manager.getRepository(CompanyEntity);
      const batchRepository = manager.getRepository(BatchEntity);
      const stockRepository = manager.getRepository(BloodstockEntity);
      const historyRepository = manager.getRepository(BloodstockMovementEntity);

      const batch = await batchRepository.findOne({
        where: { id: dto.batchCode },
        relations: { bloodDetails: true },
      });
      if (!batch) {
        throw new NoSuchElementException('Lote não encontrado');
      }

      const company = await companyRepository.findOne({ where: { id: companyId, fkUserId: userId } });
      if (!company) {
        throw new NoSuchElementException('Empresa não encontrada ou usuário sem permissão');
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

        /*
        Validação de consistência do estoque base por tipo sanguíneo durante a entrada de lote.
        Mesmo com a regra de negócio de pré-inicialização (todos os tipos com quantidade 0), 
        a checagem if (!stock) permanece como proteção contra dados incompletos/inconsistentes no banco.
        Se o registro não existir, a operação é interrompida com NoSuchElementException,
         evitando atualização incorreta e mantendo integridade transacional.
        */
        if (!stock) {
        throw new NoSuchElementException(
          `Estoque base não inicializado para ${type} na empresa ${companyId}`,
        );
        }
        

        const oldStockQty = stock.quantity;
        const newStockQty = oldStockQty - qty;
        if (newStockQty < 0) {
          throw new IllegalArgumentException('Resultado inválido: estoque negativo');
        }
        
        stock.quantity = newStockQty;
        await stockRepository.save(stock);

        const actionBy = company?.fkUserId
        const history = historyRepository.create({
          bloodstock: stock,
          movement: qty * -1,
          quantityBefore: oldStockQty,
          quantityAfter: newStockQty,
          actionBy: actionBy,
          notes: `Saída por lote: ${batch.batchCode}`,
          actionDate: new Date(),
        });
        await historyRepository.save(history);
      }

      return batchRepository.save(batch);
    });
  }

  /**
   * Retorna o histórico de movimentações de um item de estoque ordenado por data.
   */
  getHistoryByBatchCode(batchCode: string): Promise<BloodstockMovementEntity[]> {
    return this.historyRepository.find({
      where: { bloodstock: { id: batchCode } },
      relations: { bloodstock: true },
      order: { updateDate: 'DESC' },
    });
  }
}