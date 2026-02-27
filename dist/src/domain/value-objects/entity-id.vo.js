"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityId = void 0;
const crypto_1 = require("crypto");
class EntityId {
    value;
    constructor(value) {
        if (!value) {
            this.value = (0, crypto_1.randomUUID)();
        }
        else if (!this.isValidUUID(value)) {
            throw new Error('Invalid UUID format');
        }
        else {
            this.value = value;
        }
    }
    isValidUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    getValue() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.EntityId = EntityId;
//# sourceMappingURL=entity-id.vo.js.map