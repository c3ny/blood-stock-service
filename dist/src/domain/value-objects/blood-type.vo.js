"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodType = exports.BloodTypeValue = void 0;
var BloodTypeValue;
(function (BloodTypeValue) {
    BloodTypeValue["O_POSITIVE"] = "O+";
    BloodTypeValue["O_NEGATIVE"] = "O-";
    BloodTypeValue["A_POSITIVE"] = "A+";
    BloodTypeValue["A_NEGATIVE"] = "A-";
    BloodTypeValue["B_POSITIVE"] = "B+";
    BloodTypeValue["B_NEGATIVE"] = "B-";
    BloodTypeValue["AB_POSITIVE"] = "AB+";
    BloodTypeValue["AB_NEGATIVE"] = "AB-";
})(BloodTypeValue || (exports.BloodTypeValue = BloodTypeValue = {}));
class BloodType {
    value;
    constructor(value) {
        if (!Object.values(BloodTypeValue).includes(value)) {
            throw new Error(`Invalid blood type: ${value}`);
        }
        this.value = value;
    }
    static fromString(value) {
        const bloodTypeValue = value.toUpperCase();
        if (!Object.values(BloodTypeValue).includes(bloodTypeValue)) {
            throw new Error(`Invalid blood type: ${value}`);
        }
        return new BloodType(bloodTypeValue);
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
exports.BloodType = BloodType;
//# sourceMappingURL=blood-type.vo.js.map