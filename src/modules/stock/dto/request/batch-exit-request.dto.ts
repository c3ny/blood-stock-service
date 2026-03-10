import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO para saída em lote contendo o identificador do lote e
 * as quantidades a retirar por tipo sanguíneo.
 */
export class BatchExitRequestDto {
  @ApiProperty({ description: 'Codigo do lote' })
  @IsUUID('4', { message: 'O lote é obrigatório' })
  @IsNotEmpty({ message: 'O lote é obrigatório' })
  batchCode!: string;

  @ApiProperty({
    description: 'Mapa de quantidades de saída por tipo sanguíneo',
    example: { A_POS: 2, O_NEG: 1 },
  })
  @IsObject()
  @IsOptional()
  quantities!: Record<string, number>;
}