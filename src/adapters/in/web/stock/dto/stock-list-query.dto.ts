import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

type BloodTypeValue = (typeof BLOOD_TYPES)[number];

export class StockListQueryDTO {
  @ApiPropertyOptional({
    description: 'Filtrar por ID da empresa/hospital',
    format: 'uuid',
    example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo sanguíneo',
    enum: BLOOD_TYPES,
    example: 'O+',
  })
  @IsOptional()
  @IsIn([...BLOOD_TYPES])
  bloodType?: BloodTypeValue;

  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
