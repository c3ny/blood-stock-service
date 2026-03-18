import { IsNotEmpty, IsString } from 'class-validator';

export class InitStockRequestDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  cnpj!: string;

  @IsString()
  @IsNotEmpty()
  cnes!: string;

  @IsString()
  @IsNotEmpty()
  institutionName!: string;
}