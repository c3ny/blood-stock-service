"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockCommand = void 0;
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
//# sourceMappingURL=adjust-stock.command.js.map