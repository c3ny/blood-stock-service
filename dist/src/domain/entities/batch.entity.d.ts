import { EntityId, Quantity, BloodType } from '../value-objects';
export declare class Batch {
    private id;
    private companyId;
    private code;
    private bloodType;
    private entryQuantity;
    private exitQuantity;
    constructor(id: EntityId, companyId: EntityId, code: string, bloodType: BloodType, entryQuantity: Quantity, exitQuantity: Quantity);
    static create(id: EntityId, companyId: EntityId, code: string, bloodType: BloodType, entryQuantity: Quantity, exitQuantity: Quantity): Batch;
    getId(): EntityId;
    getCompanyId(): EntityId;
    getCode(): string;
    getBloodType(): BloodType;
    getEntryQuantity(): Quantity;
    getExitQuantity(): Quantity;
    registerEntry(quantity: Quantity): void;
    registerExit(quantity: Quantity): void;
    getAvailableQuantity(): Quantity;
    private normalizeBatchCode;
}
