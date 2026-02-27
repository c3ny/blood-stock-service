"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Batch = void 0;
const value_objects_1 = require("../value-objects");
const errors_1 = require("../errors");
class Batch {
    id;
    companyId;
    code;
    bloodType;
    entryQuantity;
    exitQuantity;
    constructor(id, companyId, code, bloodType, entryQuantity, exitQuantity) {
        this.id = id;
        this.companyId = companyId;
        this.code = this.normalizeBatchCode(code);
        this.bloodType = bloodType;
        this.entryQuantity = entryQuantity;
        this.exitQuantity = exitQuantity;
    }
    static create(id, companyId, code, bloodType, entryQuantity, exitQuantity) {
        return new Batch(id, companyId, code, bloodType, entryQuantity, exitQuantity);
    }
    getId() {
        return this.id;
    }
    getCompanyId() {
        return this.companyId;
    }
    getCode() {
        return this.code;
    }
    getBloodType() {
        return this.bloodType;
    }
    getEntryQuantity() {
        return this.entryQuantity;
    }
    getExitQuantity() {
        return this.exitQuantity;
    }
    registerEntry(quantity) {
        this.entryQuantity = this.entryQuantity.add(quantity);
    }
    registerExit(quantity) {
        if (this.exitQuantity.add(quantity).getValue() > this.entryQuantity.getValue()) {
            throw new errors_1.InvalidBatchOperationError(`Cannot exit ${quantity.getValue()} units. Exit quantity would exceed entry quantity.`);
        }
        this.exitQuantity = this.exitQuantity.add(quantity);
    }
    getAvailableQuantity() {
        return new value_objects_1.Quantity(this.entryQuantity.getValue() - this.exitQuantity.getValue());
    }
    normalizeBatchCode(code) {
        return code.toUpperCase().trim();
    }
}
exports.Batch = Batch;
//# sourceMappingURL=batch.entity.js.map