import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloodstockEntity } from './bloodstock.entity';

@Entity({ name: 'bloodstock_movement' })
export class BloodstockMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BloodstockEntity, (stock) => stock.movements, { nullable: false })
  @JoinColumn({ name: 'bloodstock_id' })
  bloodstock!: BloodstockEntity;

  @Column({ type: 'int' })
  movement!: number;

  @Column({ name: 'quantity_before', type: 'int', nullable: true })
  quantityBefore?: number;

  @Column({ name: 'quantity_after', type: 'int', nullable: true })
  quantityAfter?: number;

  @Column({ name: 'action_by', nullable: true })
  actionBy?: string;

  @Column({ name: 'action_date', type: 'timestamp', nullable: true })
  actionDate?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'update_date', type: 'timestamp', nullable: true })
  updateDate?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  refreshUpdateDate(): void {
    this.updateDate = new Date();
  }
}