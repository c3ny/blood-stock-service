import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BatchEntity } from './batch.entity';
import { BloodType } from './blood-type.enum';

@Entity({ name: 'batch_blood' })
export class BatchBloodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BatchEntity, (batch) => batch.bloodDetails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batch_id' })
  batch!: BatchEntity;

  @Column({ name: 'blood_type', type: 'varchar', length: 10 })
  bloodType!: BloodType;

  @Column({ type: 'int', default: 0 })
  quantity!: number;
}