import { Module } from '@nestjs/common';
import { AdjustStockModule } from '@adapters/modules';
import { HealthController } from '@adapters/in/web/health/health.controller';

@Module({
  imports: [AdjustStockModule],
  controllers: [HealthController],
})
export class AppModule {}
