import { IsInt, IsNotEmpty, IsString, MaxLength, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockRequestDTO {
  @ApiProperty({
    description: 'Quantidade a ser ajustada no estoque (positivo para entrada, negativo para saída)',
    example: 10,
    type: Number,
    minimum: -999999,
    maximum: 999999,
  })
  @IsInt({ message: 'Movement must be an integer' })
  @NotEquals(0, { message: 'Movement cannot be zero' })
  movement: number = 0;

  @ApiProperty({
    description: 'Identificador do usuário ou sistema que realizou a movimentação',
    example: 'admin@bloodstock.com',
    type: String,
    maxLength: 255,
  })
  @IsString({ message: 'ActionBy must be a string' })
  @IsNotEmpty({ message: 'ActionBy is required' })
  @MaxLength(255, { message: 'ActionBy must not exceed 255 characters' })
  actionBy: string = '';

  @ApiProperty({
    description: 'Observações ou justificativa para a movimentação',
    example: 'Doação de sangue de campanha empresarial',
    type: String,
    maxLength: 1000,
    required: false,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes: string = '';
}
