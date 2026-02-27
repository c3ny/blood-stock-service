"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchStockPolicyService = void 0;
const entities_1 = require("../entities");
const value_objects_1 = require("../value-objects");
class BatchStockPolicyService {
    coordinateStockMovement(batch, stock, movement, actionBy, notes) {
        const quantityBefore = this.getQuantityByBloodType(stock, stock.getBloodType().getValue());
        const quantityAfter = new value_objects_1.Quantity(quantityBefore.getValue() + movement);
        const stockMovement = new entities_1.StockMovement({
            id: new value_objects_1.EntityId(),
            stockId: stock.getId(),
            quantityBefore,
            movement,
            quantityAfter,
            actionBy,
            notes,
            createdAt: new Date(),
        });
        return stockMovement;
    }
    getQuantityByBloodType(stock, bloodType) {
        const type = bloodType;
        if (type === 'A+' || type === 'A-')
            return stock.getQuantityA();
        if (type === 'B+' || type === 'B-')
            return stock.getQuantityB();
        if (type === 'AB+' || type === 'AB-')
            return stock.getQuantityAB();
        if (type === 'O+' || type === 'O-')
            return stock.getQuantityO();
        throw new Error(`Unknown blood type: ${type}`);
    }
}
exports.BatchStockPolicyService = BatchStockPolicyService;
//# sourceMappingURL=batch-stock-policy.service.js.map