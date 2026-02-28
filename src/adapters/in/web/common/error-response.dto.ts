import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDTO {
  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 404,
    enum: [400, 401, 403, 404, 429, 500, 503],
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Código interno padronizado da falha',
    example: 'STOCK_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'Mensagem descritiva do erro',
    example: 'Stock with ID 26f6de4c-3e38-46ad-a9da-5d1e6bb663ae not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalhes adicionais do erro para troubleshooting',
    required: false,
    example: {
      path: '/api/v1/stocks/26f6de4c-3e38-46ad-a9da-5d1e6bb663ae',
      timestamp: '2026-02-27T20:20:10.125Z',
      errors: ['stockId must be a UUID'],
    },
  })
  details?: unknown;

  @ApiProperty({
    description: 'Identificador de rastreamento da requisição',
    example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
  })
  traceId!: string;
}

export class ValidationErrorResponseDTO {
  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Código interno padronizado da falha',
    example: 'VALIDATION_ERROR',
  })
  code!: string;

  @ApiProperty({
    description: 'Mensagem resumida do erro',
    example: 'Validation failed',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalhes de validação por campo',
    example: {
      errors: ['movement must not be equal to 0'],
    },
  })
  details!: unknown;

  @ApiProperty({
    description: 'Identificador de rastreamento da requisição',
    example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
  })
  traceId!: string;
}

export class InsufficientStockErrorDTO {
  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Código interno padronizado da falha',
    example: 'INSUFFICIENT_STOCK',
  })
  code!: string;

  @ApiProperty({
    description: 'Mensagem de erro de estoque insuficiente',
    example: 'Insufficient stock for stockId abc123: requested 50 units, available 30 units',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalhes de disponibilidade e falta',
    example: {
      available: 30,
      requested: 50,
      shortage: 20,
    },
  })
  details!: unknown;

  @ApiProperty({
    description: 'Identificador de rastreamento da requisição',
    example: '8f31a07d-3f7e-4109-85c6-0f2b2f7a7f8c',
  })
  traceId!: string;
}
