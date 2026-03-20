import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitStockRequestDto {
  @ApiProperty({ description: 'ID da empresa', example: 'uuid-da-empresa' })
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({ description: 'CNPJ da empresa', example: '12.345.678/0001-90' })
  @IsString()
  @IsNotEmpty()
  cnpj!: string;

  @ApiProperty({ description: 'CNES da instituição', example: '1234567' })
  @IsString()
  @IsNotEmpty()
  cnes!: string;

  @ApiProperty({ description: 'Nome da instituição', example: 'Hemocentro Regional' })
  @IsString()
  @IsNotEmpty()
  institutionName!: string;
}
