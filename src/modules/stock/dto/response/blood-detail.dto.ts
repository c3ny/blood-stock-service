import { ApiProperty } from '@nestjs/swagger';
import { BloodType } from 'src/modules/batch/entities/blood-type.enum';

export class BloodDetailDto {
  @ApiProperty({ description: 'ID do detalhe', example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ description: 'Tipo sanguíneo', enum: BloodType, example: BloodType.A_POS })
  bloodType!: BloodType;

  @ApiProperty({ description: 'Quantidade', example: 5 })
  quantity!: number;
}
