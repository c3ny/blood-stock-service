import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidade de empresa (hemocentro/instituição) proprietária dos estoques e lotes.
 */
@Entity({ name: 'company' })
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: false })
  cnpj?: string;

  @Column({ nullable: false })
  cnes?: string;

  @Column({ name: 'institution_name', nullable: true })
  institutionName?: string;

  @Column({ name: 'fk_user_id', type: 'uuid', nullable: true })
  fkUserId?: string;
}