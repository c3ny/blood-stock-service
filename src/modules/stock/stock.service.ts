import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { BatchBloodEntity } from "../batch/entities/batch-blood.entity";
import { BatchEntity } from "../batch/entities/batch.entity";
import { BloodType } from "../batch/entities/blood-type.enum";
import { CompanyEntity } from "../company/entities/company.entity";
import { BatchEntryRequestDto } from "./dto/request/batch-entry-request.dto";
import { BatchExitRequestDto } from "./dto/request/batch-exit-request.dto";
import { IllegalArgumentException } from "../shared/errors/exceptions/illegal-argument.exception";
import { NoSuchElementException } from "../shared/errors/exceptions/no-such-element.exception";
import { InsufficientStockException } from "./exceptions/insufficient-stock.exception";
import { BloodstockMovementEntity } from "./entities/bloodstock-movement.entity";
import { BloodstockEntity } from "./entities/bloodstock.entity";
import { InitStockRequestDto } from "./dto/request/init-stock-request.dto";

@Injectable()
export class StockService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BloodstockEntity)
    private readonly stockRepository: Repository<BloodstockEntity>,
    @InjectRepository(BloodstockMovementEntity)
    private readonly movementRepository: Repository<BloodstockMovementEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  findByCompany(companyId: string): Promise<BloodstockEntity[]> {
    return this.stockRepository.find({
      where: { company: { id: companyId } },
    });
  }

  async processBatchEntry(
    batchCode: string,
    companyId: string,
    dto: BatchEntryRequestDto,
  ): Promise<BatchEntity> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(CompanyEntity);
      const batchRepo = manager.getRepository(BatchEntity);
      const batchBloodRepo = manager.getRepository(BatchBloodEntity);
      const stockRepo = manager.getRepository(BloodstockEntity);
      const movementRepo = manager.getRepository(BloodstockMovementEntity);

      const company = await companyRepo.findOne({ where: { id: companyId } });
      if (!company) throw new NoSuchElementException("Empresa não encontrada");

      // Cria ou atualiza o lote
      let batch = await batchRepo.findOne({
        where: { batchCode, company: { id: companyId } },
        relations: ["bloodDetails"],
      });

      if (!batch) {
        batch = batchRepo.create({
          company,
          batchCode: dto.batchCode,
          entryDate: dto.entryDate.split("/").reverse().join("-"),
          bloodDetails: [],
        });
        batch = await batchRepo.save(batch);
      }

      for (const [bloodType, qty] of Object.entries(
        dto.bloodQuantities ?? {},
      )) {
        if (qty <= 0) continue;

        const type = bloodType as BloodType;

        // Atualiza batch_blood
        let batchBlood = batch.bloodDetails.find((d) => d.bloodType === type);
        if (batchBlood) {
          batchBlood.quantity += qty;
        } else {
          batchBlood = batchBloodRepo.create({
            batch,
            bloodType: type,
            quantity: qty,
            expiryDate: dto.expiryDate.split("/").reverse().join("-"),
          });
          batch.bloodDetails.push(batchBlood);
        }

        // Busca estoque agregado por company + bloodType
        let stock = await stockRepo.findOne({
          where: { company: { id: companyId }, bloodType: type },
        });

        if (!stock)
          throw new NoSuchElementException(
            `Estoque não inicializado para ${type} na empresa ${companyId}`,
          );

        const oldQty = stock.quantity;
        stock.quantity += qty;
        await stockRepo.save(stock);

        await movementRepo.save(
          movementRepo.create({
            bloodstock: stock,
            batch,
            movement: qty,
            quantityBefore: oldQty,
            quantityAfter: stock.quantity,
            actionBy: company.fkUserId,
            notes: `Entrada: lote ${dto.batchCode}`,
          }),
        );
      }

      return batchRepo.save(batch);
    });
  }

  async processBatchExit(
    companyId: string,
    dto: BatchExitRequestDto,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(CompanyEntity);
      const batchBloodRepo = manager.getRepository(BatchBloodEntity);
      const stockRepo = manager.getRepository(BloodstockEntity);
      const movementRepo = manager.getRepository(BloodstockMovementEntity);
      const batchRepo = manager.getRepository(BatchEntity);

      const company = await companyRepo.findOne({ where: { id: companyId } });
      if (!company) throw new NoSuchElementException("Empresa não encontrada");

      for (const [bloodType, totalQtyToRemove] of Object.entries(
        dto.quantities ?? {},
      )) {
        if (totalQtyToRemove <= 0) continue;

        const type = bloodType as BloodType;

        // Busca todos os batch_blood desse tipo para essa empresa,
        // ordenados por expiryDate (FEFO - primeiro a vencer, primeiro a sair)
        const availableBatchBloods = await batchBloodRepo
          .createQueryBuilder("bb")
          .innerJoinAndSelect("bb.batch", "batch")
          .innerJoin("batch.company", "company")
          .where("company.id = :companyId", { companyId })
          .andWhere("bb.blood_type = :bloodType", { bloodType: type })
          .andWhere("bb.quantity > 0")
          .andWhere("batch.exit_date IS NULL") 
          .orderBy("bb.expiry_date", "ASC") // ← FEFO
          .getMany();

        // Valida se tem quantidade suficiente no total
        const totalAvailable = availableBatchBloods.reduce(
          (sum, bb) => sum + bb.quantity,
          0,
        );
        if (totalAvailable < totalQtyToRemove) {
          throw new InsufficientStockException(
            `Quantidade insuficiente de ${type}. Disponível: ${totalAvailable}, solicitado: ${totalQtyToRemove}`,
          );
        }

        // Busca o stock agregado
        const stock = await stockRepo.findOne({
          where: { company: { id: companyId }, bloodType: type },
        });
        if (!stock)
          throw new NoSuchElementException(
            `Estoque não inicializado para ${type}`,
          );

        const oldStockQty = stock.quantity;
        let remaining = totalQtyToRemove;

        // FEFO: desconta dos lotes mais próximos de vencer
        for (const batchBlood of availableBatchBloods) {
          if (remaining <= 0) break;

          const deduct = Math.min(batchBlood.quantity, remaining);
          batchBlood.quantity -= deduct;
          remaining -= deduct;

          await batchBloodRepo.save(batchBlood);

          // Registra movimento por lote
          await movementRepo.save(
            movementRepo.create({
              bloodstock: stock,
              batch: batchBlood.batch,
              movement: deduct * -1,
              quantityBefore: stock.quantity,
              quantityAfter: stock.quantity - deduct,
              actionBy: company.fkUserId,
              notes: `Saída FEFO: lote ${batchBlood.batch.batchCode}`,
            }),
          );

          stock.quantity -= deduct;
        }

        await stockRepo.save(stock);

        // Registra data de saída nos lotes que foram completamente esvaziados
        const exitDate = dto.exitDate.split("/").reverse().join("-");
        for (const batchBlood of availableBatchBloods) {
          if (batchBlood.quantity === 0) {
            const batch = await batchRepo.findOne({
              where: { id: batchBlood.batch.id },
              relations: ["bloodDetails"],
            });
            if (batch) {
              const allEmpty = batch.bloodDetails.every(
                (d) => d.quantity === 0,
              );
              if (allEmpty) {
                batch.exitDate = exitDate;
                await batchRepo.save(batch);
              }
            }
          }
        }
      }
    });
  }

  // stock.service.ts
async getAvailableBatchesByBloodType(companyId: string, bloodType: string): Promise<any[]> {
  const batchBloodRepo = this.dataSource.getRepository(BatchBloodEntity);

  return batchBloodRepo
    .createQueryBuilder('bb')
    .innerJoinAndSelect('bb.batch', 'batch')
    .innerJoin('batch.company', 'company')
    .where('company.id = :companyId', { companyId })
    .andWhere('bb.blood_type = :bloodType', { bloodType })
    .andWhere('bb.quantity > 0')
    .andWhere('batch.exit_date IS NULL')
    .orderBy('bb.expiry_date', 'ASC')
    .getMany();
}

  async initializeCompanyStock(dto: InitStockRequestDto): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(CompanyEntity);
      const stockRepo = manager.getRepository(BloodstockEntity);

      // Cria ou atualiza a company no banco do bloodstock
      let company = await companyRepo.findOne({ where: { id: dto.companyId } });
      if (!company) {
        company = companyRepo.create({
          id: dto.companyId,
          cnpj: dto.cnpj,
          cnes: dto.cnes,
          institutionName: dto.institutionName,
          fkUserId: dto.companyId,
        });
        await companyRepo.save(company);
      }

      // Cria estoque zerado para cada tipo sanguíneo
      for (const bloodType of Object.values(BloodType)) {
        const exists = await stockRepo.findOne({
          where: { company: { id: dto.companyId }, bloodType },
        });

        if (!exists) {
          await stockRepo.save(
            stockRepo.create({
              company,
              bloodType,
              quantity: 0,
            }),
          );
        }
      }
    });
  }

  getHistoryByCompany(companyId: string): Promise<BloodstockMovementEntity[]> {
    return this.movementRepository.find({
      where: { bloodstock: { company: { id: companyId } } },
      relations: { bloodstock: true, batch: true },
      order: { actionDate: "DESC" },
    });
  }
}
