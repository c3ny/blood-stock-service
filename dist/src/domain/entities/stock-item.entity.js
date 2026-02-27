"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockItem = void 0;
const value_objects_1 = require("../value-objects");
const errors_1 = require("../errors");
class StockItem {
    id;
    companyId;
    bloodType;
    quantityA;
    quantityB;
    quantityAB;
    quantityO;
    constructor(id, companyId, bloodType, quantityA, quantityB, quantityAB, quantityO) {
        this.id = id;
        this.companyId = companyId;
        this.bloodType = bloodType;
        this.quantityA = quantityA;
        this.quantityB = quantityB;
        this.quantityAB = quantityAB;
        this.quantityO = quantityO;
    }
    static create(id, companyId, bloodType, quantityA, quantityB, quantityAB, quantityO) {
        return new StockItem(id, companyId, bloodType, quantityA, quantityB, quantityAB, quantityO);
    }
    getId() {
        return this.id;
    }
    getCompanyId() {
        return this.companyId;
    }
    getBloodType() {
        return this.bloodType;
    }
    getQuantityA() {
        return this.quantityA;
    }
    getQuantityB() {
        return this.quantityB;
    }
    getQuantityAB() {
        return this.quantityAB;
    }
    getQuantityO() {
        return this.quantityO;
    }
    adjustBy(movement) {
        const quantity = this.getQuantityByBloodType(this.bloodType);
        const newQuantity = quantity.getValue() + movement;
        if (newQuantity < 0) {
            throw new errors_1.InsufficientStockError(this.id.getValue(), Math.abs(movement), quantity.getValue());
        }
        this.updateQuantity(new value_objects_1.Quantity(newQuantity));
    }
    getQuantityByBloodType(bloodType) {
        const type = bloodType.getValue();
        if (type === 'A+' || type === 'A-')
            return this.quantityA;
        if (type === 'B+' || type === 'B-')
            return this.quantityB;
        if (type === 'AB+' || type === 'AB-')
            return this.quantityAB;
        if (type === 'O+' || type === 'O-')
            return this.quantityO;
        throw new Error(`Unknown blood type: ${type}`);
    }
    updateQuantity(newQuantity) {
        const type = this.bloodType.getValue();
        if (type === 'A+' || type === 'A-') {
            this.quantityA = newQuantity;
        }
        else if (type === 'B+' || type === 'B-') {
            this.quantityB = newQuantity;
        }
        else if (type === 'AB+' || type === 'AB-') {
            this.quantityAB = newQuantity;
        }
        else if (type === 'O+' || type === 'O-') {
            this.quantityO = newQuantity;
        }
    }
}
exports.StockItem = StockItem;
//# sourceMappingURL=stock-item.entity.js.map