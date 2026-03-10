import { BloodDetailDto } from './blood-detail.dto';

export class BatchResponseDto {
  id!: string;
  batchCode!: string;
  entryDate!: string | null;
  bloodDetails!: BloodDetailDto[];
}