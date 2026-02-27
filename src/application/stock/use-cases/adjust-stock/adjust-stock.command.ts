export class AdjustStockCommand {
  constructor(
    public readonly stockId: string,
    public readonly movement: number,
    public readonly actionBy: string,
    public readonly notes: string,
  ) {}
}
