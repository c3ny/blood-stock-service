import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodDetailDto } from './blood-detail.dto';

export class BatchResponseDto {
  @ApiProperty({ description: 'ID do registro de estoque', example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ description: 'Tipo sanguíneo', example: 'A+' })
  bloodType!: string;

  @ApiProperty({ description: 'Quantidade em estoque', example: 10 })
  quantity!: number;

  @ApiPropertyOptional({ description: 'Código do lote', example: 'LOTE-2026-001' })
  batchCode?: string | null;

  @ApiPropertyOptional({ description: 'Data de entrada', example: '2026-03-20' })
  entryDate?: string | null;

  @ApiPropertyOptional({ description: 'Data de saída', example: '2026-03-25' })
  exitDate?: string | null;

  @ApiPropertyOptional({ description: 'Detalhes por tipo sanguíneo', type: [BloodDetailDto] })
  bloodDetails?: BloodDetailDto[] | string;
}
