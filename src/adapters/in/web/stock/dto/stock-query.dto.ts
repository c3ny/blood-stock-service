import { ApiProperty } from '@nestjs/swagger';

export class StockItemDTO {
  @ApiProperty({
    description: 'ID único do registro de estoque',
    example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
    type: String,
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'ID da empresa/hospital proprietária do estoque',
    example: 'd6f89cf8-b229-408d-b419-82a8dce2cbec',
    type: String,
    format: 'uuid',
  })
  companyId!: string;

  @ApiProperty({
    description: 'Tipo sanguíneo armazenado',
    example: 'O+',
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  })
  bloodType!: string;

  @ApiProperty({
    description: 'Quantidade atual de sangue tipo A',
    example: 50,
    type: Number,
    minimum: 0,
  })
  quantityA!: number;

  @ApiProperty({
    description: 'Quantidade atual de sangue tipo B',
    example: 40,
    type: Number,
    minimum: 0,
  })
  quantityB!: number;

  @ApiProperty({
    description: 'Quantidade atual de sangue tipo AB',
    example: 30,
    type: Number,
    minimum: 0,
  })
  quantityAB!: number;

  @ApiProperty({
    description: 'Quantidade atual de sangue tipo O',
    example: 100,
    type: Number,
    minimum: 0,
  })
  quantityO!: number;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2026-02-27T19:17:56.000Z',
    type: Date,
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2026-02-27T19:17:56.000Z',
    type: Date,
  })
  updatedAt!: Date;
}

export class StockListResponseDTO {
  @ApiProperty({
    description: 'Lista de registros de estoque',
    type: [StockItemDTO],
  })
  items!: StockItemDTO[];

  @ApiProperty({
    description: 'Total de registros encontrados',
    example: 24,
    type: Number,
  })
  total!: number;

  @ApiProperty({
    description: 'Página atual (se paginado)',
    example: 1,
    type: Number,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: 'Itens por página (se paginado)',
    example: 10,
    type: Number,
    required: false,
  })
  limit?: number;
}

export class StockMovementDTO {
  @ApiProperty({
    description: 'ID único da movimentação',
    example: 'abc123-def456-ghi789',
    type: String,
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do estoque relacionado',
    example: '26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
    type: String,
    format: 'uuid',
  })
  stockId!: string;

  @ApiProperty({
    description: 'Quantidade movimentada (positivo = entrada, negativo = saída)',
    example: 10,
    type: Number,
  })
  movement!: number;

  @ApiProperty({
    description: 'Quantidade antes da movimentação',
    example: 100,
    type: Number,
  })
  quantityBefore!: number;

  @ApiProperty({
    description: 'Quantidade depois da movimentação',
    example: 110,
    type: Number,
  })
  quantityAfter!: number;

  @ApiProperty({
    description: 'Usuário ou sistema que realizou a movimentação',
    example: 'admin@bloodstock.com',
    type: String,
  })
  actionBy!: string;

  @ApiProperty({
    description: 'Observações sobre a movimentação',
    example: 'Doação de sangue de campanha empresarial',
    type: String,
  })
  notes!: string;

  @ApiProperty({
    description: 'Data e hora da movimentação',
    example: '2026-02-27T19:17:56.000Z',
    type: Date,
  })
  createdAt!: Date;
}

export class StockMovementsResponseDTO {
  @ApiProperty({
    description: 'Lista de movimentações',
    type: [StockMovementDTO],
  })
  items!: StockMovementDTO[];

  @ApiProperty({
    description: 'Total de movimentações',
    example: 5,
    type: Number,
  })
  total!: number;
}
