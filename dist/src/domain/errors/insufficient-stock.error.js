"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientStockError = void 0;
class InsufficientStockError extends Error {
    constructor(stockId, requiredQuantity, availableQuantity) {
        super(`Insufficient stock. Stock ID: ${stockId}, Required: ${requiredQuantity}, Available: ${availableQuantity}`);
        this.name = 'InsufficientStockError';
    }
}
exports.InsufficientStockError = InsufficientStockError;
//# sourceMappingURL=insufficient-stock.error.js.map