export declare class Quantity {
    private readonly value;
    constructor(value: number);
    getValue(): number;
    add(other: Quantity): Quantity;
    subtract(other: Quantity): Quantity;
    equals(other: Quantity): boolean;
    isGreaterThanOrEqual(other: Quantity): boolean;
    isLessThan(other: Quantity): boolean;
    toString(): string;
}
