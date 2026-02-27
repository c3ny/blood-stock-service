"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockResult = void 0;
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
//# sourceMappingURL=adjust-stock.result.js.map