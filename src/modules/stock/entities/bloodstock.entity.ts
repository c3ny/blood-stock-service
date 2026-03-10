import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CompanyEntity } from '../../company/entities/company.entity';
import { BloodType } from '../../batch/entities/blood-type.enum';
import { BloodstockMovementEntity } from './bloodstock-movement.entity';

/**
 * Entidade de estoque agregado por tipo sanguíneo e empresa.
 */
@Entity({ name: 'stock' })
@Unique('uk_stock_blood_company', ['bloodType', 'company'])
export class BloodstockEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bloodType', type: 'varchar', length: 10 })
  bloodType!: BloodType;

  @Column({ name: 'batchCode', type: 'varchar', length: 50 })
  batchCode!: string;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'entryDate', type: 'date', nullable: true })
  entryDate?: string;

  @Column({ name: 'exitDate', type: 'date', nullable: true })
  exitDate?: string;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToMany(() => BloodstockMovementEntity, (movement) => movement.bloodstock)
  movements?: BloodstockMovementEntity[];
}