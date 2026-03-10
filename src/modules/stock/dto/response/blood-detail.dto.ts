import { BloodType } from "src/modules/batch/entities/blood-type.enum";

/**
 * DTO de item detalhado de sangue dentro da resposta de um lote.
 * 
 * BloodDetailDto
  Representa cada item dentro do lote (detalhe por tipo sanguíneo).
  Campos: id, bloodType, quantity.
  Uso: é filho de BatchResponseDto em bloodDetails.
 * 
 * 
 */
export class BloodDetailDto {
  id!: string;
  bloodType!: BloodType;
  quantity!: number;
}