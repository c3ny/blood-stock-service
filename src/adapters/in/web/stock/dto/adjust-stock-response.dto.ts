export class AdjustStockResponseDTO {
  stockId: string = '';
  companyId: string = '';
  bloodType: string = '';
  quantityABefore: number = 0;
  quantityBBefore: number = 0;
  quantityABBefore: number = 0;
  quantityOBefore: number = 0;
  quantityAAfter: number = 0;
  quantityBAfter: number = 0;
  quantityABAfter: number = 0;
  quantityOAfter: number = 0;
  timestamp: Date = new Date();
}
