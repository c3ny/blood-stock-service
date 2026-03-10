import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BloodType } from '../../batch/entities/blood-type.enum';

export class CreateBloodstockDto {
  @ApiProperty({ enum: BloodType })
  @Transform(({ obj, value }) => value ?? obj.blood_type)
  @IsEnum(BloodType, { message: 'Tipo sanguíneo é obrigatório' })
  bloodType!: BloodType;

  @ApiProperty({ required: false })
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  update_date?: string;
}