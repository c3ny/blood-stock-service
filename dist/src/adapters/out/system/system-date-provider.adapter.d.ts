import { DateProviderPort } from '@application/stock/ports';
export declare class SystemDateProviderAdapter implements DateProviderPort {
    now(): Date;
}
