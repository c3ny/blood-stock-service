import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDTO {
  @ApiProperty({
    description: 'Mensagem de erro ou array de mensagens de validação',
    example: 'Stock not found',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message!: string | string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Not Found',
    enum: ['Bad Request', 'Not Found', 'Internal Server Error', 'Unauthorized', 'Forbidden'],
  })
  error!: string;

  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 404,
    enum: [400, 401, 403, 404, 500],
  })
  statusCode!: number;
}

export class ValidationErrorResponseDTO {
  @ApiProperty({
    description: 'Array de mensagens de erro de validação',
    example: ['Movement cannot be zero', 'ActionBy is required'],
    type: [String],
  })
  message!: string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request',
  })
  error!: string;

  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 400,
  })
  statusCode!: number;
}

export class InsufficientStockErrorDTO {
  @ApiProperty({
    description: 'Mensagem de erro de estoque insuficiente',
    example: 'Insufficient stock for stockId abc123: requested 50 units, available 30 units',
  })
  message!: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request',
  })
  error!: string;

  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 400,
  })
  statusCode!: number;
}
