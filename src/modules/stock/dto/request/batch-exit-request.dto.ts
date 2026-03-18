import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class BatchExitRequestDto {
  @ApiProperty({
    description: 'Mapa de tipo sanguíneo para quantidade a retirar',
    example: { 'A+': 3, 'O-': 2 },
  })
  @IsObject()
  @IsNotEmpty()
  quantities!: Record<string, number>;

  @ApiProperty({ description: 'Data de saída', example: '17/03/2026' })
  @IsString()
  @IsNotEmpty()
  exitDate!: string;
}