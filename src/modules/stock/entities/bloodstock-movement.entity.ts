import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BloodstockEntity } from './bloodstock.entity';
import { BatchEntity } from '../../batch/entities/batch.entity';

@Entity({ name: 'stock_movement' })
export class BloodstockMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BloodstockEntity, (stock) => stock.movements, { nullable: false })
  @JoinColumn({ name: 'stock_id' })
  bloodstock!: BloodstockEntity;

  @ManyToOne(() => BatchEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'batch_id' })
  batch!: BatchEntity;

  @Column({ type: 'int' })
  movement!: number; // positivo=entrada, negativo=saída

  @Column({ name: 'quantity_before', type: 'int' })
  quantityBefore!: number;

  @Column({ name: 'quantity_after', type: 'int' })
  quantityAfter!: number;

  @Column({ name: 'action_by', nullable: true })
  actionBy?: string;

  @Column({ name: 'action_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  actionDate!: Date;

  @Column({ nullable: true })
  notes?: string;
}