import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CompanyEntity } from '../../company/entities/company.entity';
import { BloodType } from '../../batch/entities/blood-type.enum';
import { BloodstockMovementEntity } from './bloodstock-movement.entity';

@Entity({ name: 'stock' })
@Unique('uk_stock_company_bloodtype', ['company', 'bloodType'])
export class BloodstockEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'blood_type', type: 'varchar', length: 10 })
  bloodType!: BloodType;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @OneToMany(() => BloodstockMovementEntity, (movement) => movement.bloodstock)
  movements?: BloodstockMovementEntity[];
}