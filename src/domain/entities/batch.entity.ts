import { EntityId, Quantity, BloodType } from '../value-objects';
import { InvalidBatchOperationError } from '../errors';

export class Batch {
  private id: EntityId;
  private companyId: EntityId;
  private code: string;
  private bloodType: BloodType;
  private entryQuantity: Quantity;
  private exitQuantity: Quantity;

  constructor(
    id: EntityId,
    companyId: EntityId,
    code: string,
    bloodType: BloodType,
    entryQuantity: Quantity,
    exitQuantity: Quantity,
  ) {
    this.id = id;
    this.companyId = companyId;
    this.code = this.normalizeBatchCode(code);
    this.bloodType = bloodType;
    this.entryQuantity = entryQuantity;
    this.exitQuantity = exitQuantity;
  }

  static create(
    id: EntityId,
    companyId: EntityId,
    code: string,
    bloodType: BloodType,
    entryQuantity: Quantity,
    exitQuantity: Quantity,
  ): Batch {
    return new Batch(id, companyId, code, bloodType, entryQuantity, exitQuantity);
  }

  getId(): EntityId {
    return this.id;
  }

  getCompanyId(): EntityId {
    return this.companyId;
  }

  getCode(): string {
    return this.code;
  }

  getBloodType(): BloodType {
    return this.bloodType;
  }

  getEntryQuantity(): Quantity {
    return this.entryQuantity;
  }

  getExitQuantity(): Quantity {
    return this.exitQuantity;
  }

  registerEntry(quantity: Quantity): void {
    this.entryQuantity = this.entryQuantity.add(quantity);
  }

  registerExit(quantity: Quantity): void {
    if (this.exitQuantity.add(quantity).getValue() > this.entryQuantity.getValue()) {
      throw new InvalidBatchOperationError(
        `Cannot exit ${quantity.getValue()} units. Exit quantity would exceed entry quantity.`,
      );
    }
    this.exitQuantity = this.exitQuantity.add(quantity);
  }

  getAvailableQuantity(): Quantity {
    return new Quantity(this.entryQuantity.getValue() - this.exitQuantity.getValue());
  }

  private normalizeBatchCode(code: string): string {
    return code.toUpperCase().trim();
  }
}
