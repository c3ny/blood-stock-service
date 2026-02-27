export enum BloodTypeValue {
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
}

export class BloodType {
  private readonly value: BloodTypeValue;

  constructor(value: BloodTypeValue) {
    if (!Object.values(BloodTypeValue).includes(value)) {
      throw new Error(`Invalid blood type: ${value}`);
    }
    this.value = value;
  }

  static fromString(value: string): BloodType {
    const bloodTypeValue = value.toUpperCase();
    if (!Object.values(BloodTypeValue).includes(bloodTypeValue as BloodTypeValue)) {
      throw new Error(`Invalid blood type: ${value}`);
    }
    return new BloodType(bloodTypeValue as BloodTypeValue);
  }

  getValue(): BloodTypeValue {
    return this.value;
  }

  equals(other: BloodType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
