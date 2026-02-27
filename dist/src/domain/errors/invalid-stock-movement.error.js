"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStockMovementError = void 0;
class InvalidStockMovementError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidStockMovementError';
    }
}
exports.InvalidStockMovementError = InvalidStockMovementError;
//# sourceMappingURL=invalid-stock-movement.error.js.map