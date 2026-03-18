import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

/**
 * DTO de entrada de lote com mapa de quantidades por tipo sanguíneo.
 */
export class BatchEntryRequestDto {
  @ApiProperty({ description: 'Código do lote' })
  @IsString()
  @IsNotEmpty({ message: 'O código do lote é obrigatório' })
  batchCode!: string;

  @ApiProperty({ description: 'Data de validade' })
  @IsString()
  @IsNotEmpty({ message: 'A data de validade é obrigatória' })
  expiryDate!: string;

  @ApiProperty({ description: 'Data de entrada' })
  @IsString()
  @IsNotEmpty({ message: 'A data de entrada é obrigatória' })
  entryDate!: string;

  @ApiProperty({
    description: 'Mapa de tipo sanguíneo para quantidade',
    example: { A_POS: 10, O_NEG: 3 },
  })
  @IsNotEmpty({ message: 'As quantidades de sangue são obrigatórias' })
  @IsObject({ message: 'As quantidades de sangue são obrigatórias' })
  bloodQuantities!: Record<string, number>;

  /**
   * Executa validação adicional de regra para garantir quantidades numéricas
   * maiores ou iguais a zero em todas as chaves informadas.
   */
  validateQuantities(): string[] {
    const errors: string[] = [];
    if (!this.bloodQuantities || typeof this.bloodQuantities !== 'object') {
      errors.push('bloodQuantities: As quantidades de sangue são obrigatórias');
      return errors;
    }

    for (const [key, value] of Object.entries(this.bloodQuantities)) {
      if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
        errors.push(`${key}: A quantidade deve ser positiva ou zero`);
      }
    }
    return errors;
  }
}