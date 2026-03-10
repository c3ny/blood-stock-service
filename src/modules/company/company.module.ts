import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity';

/**
 * Módulo que expõe o repositório de empresas para outros módulos da aplicação.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  exports: [TypeOrmModule],
})
export class CompanyModule {}