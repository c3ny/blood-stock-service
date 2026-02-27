export class AdjustStockResult {
  constructor(
    public readonly stockId: string,
    public readonly companyId: string,
    public readonly bloodType: string,
    public readonly quantityABefore: number,
    public readonly quantityBBefore: number,
    public readonly quantityABBefore: number,
    public readonly quantityOBefore: number,
    public readonly quantityAAfter: number,
    public readonly quantityBAfter: number,
    public readonly quantityABAfter: number,
    public readonly quantityOAfter: number,
    public readonly timestamp: Date,
  ) {}
}
