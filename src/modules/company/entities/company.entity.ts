import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'company' })
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  cnpj?: string;

  @Column({ nullable: true })
  cnes?: string;

  @Column({ name: 'institution_name', nullable: true })
  institutionName?: string;

  @Column({ name: 'fk_user_id', type: 'uuid', nullable: true })
  fkUserId?: string;
}