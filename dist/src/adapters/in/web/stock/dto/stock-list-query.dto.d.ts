declare const BLOOD_TYPES: readonly ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
type BloodTypeValue = (typeof BLOOD_TYPES)[number];
export declare class StockListQueryDTO {
    companyId?: string;
    bloodType?: BloodTypeValue;
    page?: number;
    limit?: number;
}
export {};
