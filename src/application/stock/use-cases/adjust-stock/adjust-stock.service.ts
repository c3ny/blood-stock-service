import { Inject, Injectable } from '@nestjs/common';
import {
  AdjustStockUseCase,
  ADJUST_STOCK_USE_CASE,
  AdjustStockCommand,
  AdjustStockResult,
  StockRepositoryPort,
  STOCK_REPOSITORY_PORT,
  StockMovementRepositoryPort,
  STOCK_MOVEMENT_REPOSITORY_PORT,
  IdGeneratorPort,
  ID_GENERATOR_PORT,
  DateProviderPort,
  DATE_PROVIDER_PORT,
} from '../../ports';
import { StockItem, StockMovement, EntityId, Quantity } from '@domain';
import { InsufficientStockError } from '@domain/errors';

@Injectable()
export class AdjustStockService implements AdjustStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_MOVEMENT_REPOSITORY_PORT)
    private readonly movementRepository: StockMovementRepositoryPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
    @Inject(DATE_PROVIDER_PORT)
    private readonly dateProvider: DateProviderPort,
  ) {}

  async execute(command: AdjustStockCommand): Promise<AdjustStockResult> {
    const stock = await this.stockRepository.findById(command.stockId);
    if (!stock) {
      throw new Error(`Stock not found with ID: ${command.stockId}`);
    }

    const quantityBefore = this.getQuantityByBloodType(stock);

    try {
      stock.adjustBy(command.movement);
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw error;
      }
      throw error;
    }

    const quantityAfter = this.getQuantityByBloodType(stock);

    const movement = new StockMovement({
      id: new EntityId(this.idGenerator.generate()),
      stockId: stock.getId(),
      quantityBefore,
      movement: command.movement,
      quantityAfter,
      actionBy: command.actionBy,
      notes: command.notes,
      createdAt: this.dateProvider.now(),
    });

    await this.movementRepository.save(movement);
    await this.stockRepository.save(stock);

    return new AdjustStockResult(
      stock.getId().getValue(),
      stock.getCompanyId().getValue(),
      stock.getBloodType().getValue(),
      quantityBefore.getValue(),
      quantityBefore.getValue(),
      quantityBefore.getValue(),
      quantityBefore.getValue(),
      quantityAfter.getValue(),
      quantityAfter.getValue(),
      quantityAfter.getValue(),
      quantityAfter.getValue(),
      this.dateProvider.now(),
    );
  }

  private getQuantityByBloodType(stock: StockItem): Quantity {
    const type = stock.getBloodType().getValue();
    if (type === 'A+' || type === 'A-') return stock.getQuantityA();
    if (type === 'B+' || type === 'B-') return stock.getQuantityB();
    if (type === 'AB+' || type === 'AB-') return stock.getQuantityAB();
    if (type === 'O+' || type === 'O-') return stock.getQuantityO();
    throw new Error(`Unknown blood type: ${type}`);
  }
}
