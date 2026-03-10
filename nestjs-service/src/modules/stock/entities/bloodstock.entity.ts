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

@Entity({ name: 'stock' })
@Unique('uk_stock_blood_company', ['bloodType', 'company'])
export class BloodstockEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 10 })
  bloodType!: BloodType;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'update_date', type: 'date', nullable: true })
  updateDate?: string;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToMany(() => BloodstockMovementEntity, (movement) => movement.bloodstock)
  movements?: BloodstockMovementEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  refreshUpdateDate(): void {
    this.updateDate = new Date().toISOString().slice(0, 10);
  }
}