"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovement = void 0;
const errors_1 = require("../errors");
class StockMovement {
    id;
    stockId;
    quantityBefore;
    movement;
    quantityAfter;
    actionBy;
    notes;
    createdAt;
    constructor(data) {
        const expectedQuantityAfter = data.quantityBefore.getValue() + data.movement;
        if (data.quantityAfter.getValue() !== expectedQuantityAfter) {
            throw new errors_1.InvalidStockMovementError(`Invalid stock movement: quantityAfter (${data.quantityAfter.getValue()}) must equal ${expectedQuantityAfter}`);
        }
        this.id = data.id;
        this.stockId = data.stockId;
        this.quantityBefore = data.quantityBefore;
        this.movement = data.movement;
        this.quantityAfter = data.quantityAfter;
        this.actionBy = data.actionBy;
        this.notes = data.notes;
        this.createdAt = data.createdAt;
    }
    getId() {
        return this.id;
    }
    getStockId() {
        return this.stockId;
    }
    getQuantityBefore() {
        return this.quantityBefore;
    }
    getMovement() {
        return this.movement;
    }
    getQuantityAfter() {
        return this.quantityAfter;
    }
    getActionBy() {
        return this.actionBy;
    }
    getNotes() {
        return this.notes;
    }
    getCreatedAt() {
        return this.createdAt;
    }
}
exports.StockMovement = StockMovement;
//# sourceMappingURL=stock-movement.entity.js.map