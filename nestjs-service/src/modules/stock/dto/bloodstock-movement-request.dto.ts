import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, Min } from 'class-validator';

export class BloodstockMovementRequestDto {
  @ApiProperty({ description: 'ID do item de estoque' })
  @IsUUID('4', { message: 'O ID do bloodstock não pode ser nulo' })
  @IsNotEmpty({ message: 'O ID do bloodstock não pode ser nulo' })
  bloodstockId!: string;

  @ApiProperty({ description: 'Quantidade de movimentação', example: 10 })
  @Min(1, { message: 'A quantidade deve ser pelo menos 1' })
  quantity!: number;
}