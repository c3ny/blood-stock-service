import { EntityId, Quantity, BloodType } from '../value-objects';
import { InsufficientStockError } from '../errors';

export class StockItem {
  constructor(
    private id: EntityId,
    private companyId: EntityId,
    private bloodType: BloodType,
    private quantityA: Quantity,
    private quantityB: Quantity,
    private quantityAB: Quantity,
    private quantityO: Quantity,
  ) {}

  static create(
    id: EntityId,
    companyId: EntityId,
    bloodType: BloodType,
    quantityA: Quantity,
    quantityB: Quantity,
    quantityAB: Quantity,
    quantityO: Quantity,
  ): StockItem {
    return new StockItem(id, companyId, bloodType, quantityA, quantityB, quantityAB, quantityO);
  }

  getId(): EntityId {
    return this.id;
  }

  getCompanyId(): EntityId {
    return this.companyId;
  }

  getBloodType(): BloodType {
    return this.bloodType;
  }

  getQuantityA(): Quantity {
    return this.quantityA;
  }

  getQuantityB(): Quantity {
    return this.quantityB;
  }

  getQuantityAB(): Quantity {
    return this.quantityAB;
  }

  getQuantityO(): Quantity {
    return this.quantityO;
  }

  adjustBy(movement: number): void {
    const quantity = this.getQuantityByBloodType(this.bloodType);
    const newQuantity = quantity.getValue() + movement;

    if (newQuantity < 0) {
      throw new InsufficientStockError(
        this.id.getValue(),
        Math.abs(movement),
        quantity.getValue(),
      );
    }

    this.updateQuantity(new Quantity(newQuantity));
  }

  private getQuantityByBloodType(bloodType: BloodType): Quantity {
    const type = bloodType.getValue();
    if (type === 'A+' || type === 'A-') return this.quantityA;
    if (type === 'B+' || type === 'B-') return this.quantityB;
    if (type === 'AB+' || type === 'AB-') return this.quantityAB;
    if (type === 'O+' || type === 'O-') return this.quantityO;
    throw new Error(`Unknown blood type: ${type}`);
  }

  private updateQuantity(newQuantity: Quantity): void {
    const type = this.bloodType.getValue();
    if (type === 'A+' || type === 'A-') {
      this.quantityA = newQuantity;
    } else if (type === 'B+' || type === 'B-') {
      this.quantityB = newQuantity;
    } else if (type === 'AB+' || type === 'AB-') {
      this.quantityAB = newQuantity;
    } else if (type === 'O+' || type === 'O-') {
      this.quantityO = newQuantity;
    }
  }
}
