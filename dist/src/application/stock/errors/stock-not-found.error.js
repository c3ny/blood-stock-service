"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockNotFoundError = void 0;
class StockNotFoundError extends Error {
    constructor(stockId) {
        super(`Stock not found with ID: ${stockId}`);
        this.name = 'StockNotFoundError';
    }
}
exports.StockNotFoundError = StockNotFoundError;
//# sourceMappingURL=stock-not-found.error.js.map