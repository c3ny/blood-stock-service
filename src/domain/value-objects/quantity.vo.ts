export class Quantity {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Quantity must be a non-negative integer');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Quantity cannot be negative after subtraction');
    }
    return new Quantity(result);
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}
