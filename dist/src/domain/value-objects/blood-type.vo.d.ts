export declare enum BloodTypeValue {
    O_POSITIVE = "O+",
    O_NEGATIVE = "O-",
    A_POSITIVE = "A+",
    A_NEGATIVE = "A-",
    B_POSITIVE = "B+",
    B_NEGATIVE = "B-",
    AB_POSITIVE = "AB+",
    AB_NEGATIVE = "AB-"
}
export declare class BloodType {
    private readonly value;
    constructor(value: BloodTypeValue);
    static fromString(value: string): BloodType;
    getValue(): BloodTypeValue;
    equals(other: BloodType): boolean;
    toString(): string;
}
