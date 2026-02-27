"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADJUST_STOCK_USE_CASE = exports.AdjustStockResult = exports.AdjustStockCommand = void 0;
class AdjustStockCommand {
    stockId;
    movement;
    actionBy;
    notes;
    constructor(stockId, movement, actionBy, notes) {
        this.stockId = stockId;
        this.movement = movement;
        this.actionBy = actionBy;
        this.notes = notes;
    }
}
exports.AdjustStockCommand = AdjustStockCommand;
class AdjustStockResult {
    stockId;
    companyId;
    bloodType;
    quantityABefore;
    quantityBBefore;
    quantityABBefore;
    quantityOBefore;
    quantityAAfter;
    quantityBAfter;
    quantityABAfter;
    quantityOAfter;
    timestamp;
    constructor(stockId, companyId, bloodType, quantityABefore, quantityBBefore, quantityABBefore, quantityOBefore, quantityAAfter, quantityBAfter, quantityABAfter, quantityOAfter, timestamp) {
        this.stockId = stockId;
        this.companyId = companyId;
        this.bloodType = bloodType;
        this.quantityABefore = quantityABefore;
        this.quantityBBefore = quantityBBefore;
        this.quantityABBefore = quantityABBefore;
        this.quantityOBefore = quantityOBefore;
        this.quantityAAfter = quantityAAfter;
        this.quantityBAfter = quantityBAfter;
        this.quantityABAfter = quantityABAfter;
        this.quantityOAfter = quantityOAfter;
        this.timestamp = timestamp;
    }
}
exports.AdjustStockResult = AdjustStockResult;
exports.ADJUST_STOCK_USE_CASE = Symbol('ADJUST_STOCK_USE_CASE');
//# sourceMappingURL=adjust-stock.use-case.js.map