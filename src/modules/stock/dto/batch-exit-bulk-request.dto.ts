import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';

export class BatchExitBulkRequestDto {
  @ApiProperty({ description: 'ID do lote' })
  @IsUUID('4', { message: 'O lote é obrigatório' })
  @IsNotEmpty({ message: 'O lote é obrigatório' })
  batchId!: string;

  @ApiProperty({
    description: 'Mapa de quantidades de saída por tipo sanguíneo',
    example: { A_POS: 2, O_NEG: 1 },
  })
  @IsObject()
  @IsOptional()
  quantities!: Record<string, number>;
}