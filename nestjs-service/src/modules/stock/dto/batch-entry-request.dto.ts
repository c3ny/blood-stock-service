import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class BatchEntryRequestDto {
  @ApiProperty({ description: 'Código do lote' })
  @IsString()
  @IsNotEmpty({ message: 'O código do lote é obrigatório' })
  batchCode!: string;

  @ApiProperty({
    description: 'Mapa de tipo sanguíneo para quantidade',
    example: { A_POS: 10, O_NEG: 3 },
  })
  @IsNotEmpty({ message: 'As quantidades de sangue são obrigatórias' })
  @IsObject({ message: 'As quantidades de sangue são obrigatórias' })
  bloodQuantities!: Record<string, number>;

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