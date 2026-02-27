export declare class EntityId {
    private readonly value;
    constructor(value?: string);
    private isValidUUID;
    getValue(): string;
    equals(other: EntityId): boolean;
    toString(): string;
}
