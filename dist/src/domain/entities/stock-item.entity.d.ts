import { EntityId, Quantity, BloodType } from '../value-objects';
export declare class StockItem {
    private id;
    private companyId;
    private bloodType;
    private quantityA;
    private quantityB;
    private quantityAB;
    private quantityO;
    constructor(id: EntityId, companyId: EntityId, bloodType: BloodType, quantityA: Quantity, quantityB: Quantity, quantityAB: Quantity, quantityO: Quantity);
    static create(id: EntityId, companyId: EntityId, bloodType: BloodType, quantityA: Quantity, quantityB: Quantity, quantityAB: Quantity, quantityO: Quantity): StockItem;
    getId(): EntityId;
    getCompanyId(): EntityId;
    getBloodType(): BloodType;
    getQuantityA(): Quantity;
    getQuantityB(): Quantity;
    getQuantityAB(): Quantity;
    getQuantityO(): Quantity;
    adjustBy(movement: number): void;
    private getQuantityByBloodType;
    private updateQuantity;
}
