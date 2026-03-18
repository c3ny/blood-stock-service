import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BatchEntity } from './batch.entity';
import { BloodType } from './blood-type.enum';

/**
 * Entidade de detalhe de lote, contendo quantidade por tipo sanguíneo.
 */
@Entity({ name: 'batch_blood' })
export class BatchBloodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BatchEntity, (batch) => batch.bloodDetails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batchCode' })
  batch!: BatchEntity;

  @Column({ name: 'blood_type', type: 'varchar', length: 10 })
  bloodType!: BloodType;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ name: 'expiry_date', type: 'date', nullable: false })
  expiryDate!: string;
}