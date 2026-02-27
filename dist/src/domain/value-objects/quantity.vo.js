"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quantity = void 0;
class Quantity {
    value;
    constructor(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error('Quantity must be a non-negative integer');
        }
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    add(other) {
        return new Quantity(this.value + other.value);
    }
    subtract(other) {
        const result = this.value - other.value;
        if (result < 0) {
            throw new Error('Quantity cannot be negative after subtraction');
        }
        return new Quantity(result);
    }
    equals(other) {
        return this.value === other.value;
    }
    isGreaterThanOrEqual(other) {
        return this.value >= other.value;
    }
    isLessThan(other) {
        return this.value < other.value;
    }
    toString() {
        return this.value.toString();
    }
}
exports.Quantity = Quantity;
//# sourceMappingURL=quantity.vo.js.map