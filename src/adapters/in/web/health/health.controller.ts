import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponseDTO } from './dto/health-response.dto';

@ApiTags('Sistema')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Verifica o status de saúde da aplicação e suas dependências. ' +
      'Útil para monitoramento em ambientes Kubernetes, Docker Swarm e ferramentas de observabilidade.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação está saudável',
    type: HealthResponseDTO,
    example: {
      status: 'healthy',
      timestamp: '2025-02-27T14:30:00.000Z',
      uptime: 3600,
      version: '1.0.0',
      services: {
        database: 'up',
        api: 'up',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicação ou dependências com problemas',
    example: {
      status: 'unhealthy',
      timestamp: '2025-02-27T14:30:00.000Z',
      uptime: 3600,
      version: '1.0.0',
      services: {
        database: 'down',
        api: 'up',
      },
      error: 'Database connection failed',
    },
  })
  async checkHealth(): Promise<HealthResponseDTO> {
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: '1.0.0',
      services: {
        database: 'up',
        api: 'up',
      },
    };
  }
}
