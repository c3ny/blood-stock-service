import { Module } from '@nestjs/common';
import { AdjustStockModule } from '@adapters/modules';

@Module({
  imports: [AdjustStockModule],
})
export class AppModule {}
