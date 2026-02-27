import { randomUUID } from 'crypto';

export class EntityId {
  private readonly value: string;

  constructor(value?: string) {
    if (!value) {
      this.value = randomUUID();
    } else if (!this.isValidUUID(value)) {
      throw new Error('Invalid UUID format');
    } else {
      this.value = value;
    }
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EntityId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
