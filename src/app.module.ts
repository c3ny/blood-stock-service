import { Module } from '@nestjs/common';
import { StockModule } from './modules/stock/stock.module';
import { HealthController } from '@adapters/in/web/health/health.controller';

@Module({
  imports: [StockModule],
  controllers: [HealthController],
})
export class AppModule {}
