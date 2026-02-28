import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockResponseDTO {
  @ApiProperty({
    description: 'ID do registro de estoque',
    example: '950c8baf-fed8-4d38-b99e-59c614251930',
    type: String,
  })
  stockId: string = '';

  @ApiProperty({
    description: 'ID da empresa/hospital',
    example: 'f5ba6e2f-43cc-49e8-8275-2b655209fc73',
    type: String,
  })
  companyId: string = '';

  @ApiProperty({
    description: 'Tipo sanguíneo',
    example: 'O+',
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  })
  bloodType: string = '';

  @ApiProperty({
    description: 'Quantidade de sangue tipo A antes da movimentação',
    example: 0,
    type: Number,
  })
  quantityABefore: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo B antes da movimentação',
    example: 0,
    type: Number,
  })
  quantityBBefore: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo AB antes da movimentação',
    example: 0,
    type: Number,
  })
  quantityABBefore: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo O antes da movimentação',
    example: 100,
    type: Number,
  })
  quantityOBefore: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo A depois da movimentação',
    example: 0,
    type: Number,
  })
  quantityAAfter: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo B depois da movimentação',
    example: 0,
    type: Number,
  })
  quantityBAfter: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo AB depois da movimentação',
    example: 0,
    type: Number,
  })
  quantityABAfter: number = 0;

  @ApiProperty({
    description: 'Quantidade de sangue tipo O depois da movimentação',
    example: 110,
    type: Number,
  })
  quantityOAfter: number = 0;

  @ApiProperty({
    description: 'Data e hora da movimentação',
    example: '2026-02-27T19:10:03.000Z',
    type: Date,
  })
  timestamp: Date = new Date();
}
