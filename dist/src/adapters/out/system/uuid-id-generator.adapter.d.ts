import { IdGeneratorPort } from '@application/stock/ports';
export declare class UuidIdGeneratorAdapter implements IdGeneratorPort {
    generate(): string;
}
