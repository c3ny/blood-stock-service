import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CompanyEntity } from '../../company/entities/company.entity';
import { BatchBloodEntity } from './batch-blood.entity';

@Entity({ name: 'batch' })
@Unique('uk_batch_code', ['batchCode'])
export class BatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'batch_code' })
  batchCode!: string;

  @Column({ name: 'entry_date', type: 'date', nullable: false })
  entryDate!: string;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToMany(() => BatchBloodEntity, (detail) => detail.batch, {
    cascade: true,
    eager: true,
  })
  bloodDetails!: BatchBloodEntity[];
}