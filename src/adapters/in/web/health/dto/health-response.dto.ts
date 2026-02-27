import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDTO {
  @ApiProperty({
    description: 'Status geral da aplicação',
    example: 'healthy',
    enum: ['healthy', 'unhealthy'],
  })
  status!: 'healthy' | 'unhealthy';

  @ApiProperty({
    description: 'Timestamp da verificação (ISO 8601)',
    example: '2025-02-27T14:30:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Tempo de atividade da aplicação em segundos',
    example: 3600,
    type: 'number',
  })
  uptime!: number;

  @ApiProperty({
    description: 'Versão da aplicação',
    example: '1.0.0',
  })
  version!: string;

  @ApiProperty({
    description: 'Status dos serviços/dependências',
    example: {
      database: 'up',
      api: 'up',
    },
    type: 'object',
    properties: {
      database: {
        type: 'string',
        enum: ['up', 'down'],
        description: 'Status da conexão com o banco de dados',
      },
      api: {
        type: 'string',
        enum: ['up', 'down'],
        description: 'Status da API',
      },
    },
  })
  services!: {
    database: 'up' | 'down';
    api: 'up' | 'down';
  };

  @ApiProperty({
    description: 'Mensagem de erro em caso de falha (opcional)',
    required: false,
    example: 'Database connection timeout',
  })
  error?: string;
}
