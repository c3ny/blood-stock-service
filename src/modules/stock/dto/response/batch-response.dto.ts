import { BloodDetailDto } from './blood-detail.dto';

/**
 * DTO de resposta para representar lote e seus detalhes de sangue.
 * 
 * BatchResponseDto
  Representa o lote (cabeçalho) com dados gerais do lote.
  Campos: id, batchCode, entryDate, exitDate, bloodDetails.
  Uso: endpoints de lote.
 * 
 * 
 */
export class BatchResponseDto {
  id!: string;
  bloodType!: string;
  quantity!: number;
  batchCode?: string | null;
  entryDate?: string | null;
  exitDate?: string | null;
  bloodDetails?: BloodDetailDto[] | string;
}