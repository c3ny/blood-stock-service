"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidBatchOperationError = void 0;
class InvalidBatchOperationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidBatchOperationError';
    }
}
exports.InvalidBatchOperationError = InvalidBatchOperationError;
//# sourceMappingURL=invalid-batch-operation.error.js.map