import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchBloodEntity } from './entities/batch-blood.entity';
import { BatchEntity } from './entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BatchEntity, BatchBloodEntity])],
  exports: [TypeOrmModule],
})
export class BatchModule {}