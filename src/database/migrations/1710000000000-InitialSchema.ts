import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria o esquema inicial do banco com tabelas de empresa, lote,
 * detalhe de lote, estoque e histórico de movimentações.
 */
export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  /**
   * Aplica a migração criando extensão e tabelas necessárias do domínio.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        cnpj VARCHAR(255),
        cnes VARCHAR(255),
        institution_name VARCHAR(255),
        fk_user_id UUID
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS batch (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_code VARCHAR(255) NOT NULL,
        entry_date DATE NOT NULL,
        company_id UUID NOT NULL,
        CONSTRAINT uk_batch_code UNIQUE (batch_code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS batch_blood (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL,
        blood_type VARCHAR(10) NOT NULL,
        quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        CONSTRAINT fk_batch_blood_batch FOREIGN KEY (batch_id)
          REFERENCES batch(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blood_type VARCHAR(10) NOT NULL,
        quantity INT NOT NULL CHECK (quantity >= 0),
        update_date DATE,
        company_id UUID NOT NULL,
        CONSTRAINT uk_stock_blood_company UNIQUE (blood_type, company_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bloodstock_movement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bloodstock_id UUID NOT NULL,
        movement INT NOT NULL,
        quantity_before INT,
        quantity_after INT,
        action_by VARCHAR(255),
        action_date TIMESTAMP,
        notes VARCHAR(255),
        update_date TIMESTAMP,
        CONSTRAINT fk_movement_stock FOREIGN KEY (bloodstock_id)
          REFERENCES stock(id)
      )
    `);
  }

  /**
   * Reverte a migração removendo as tabelas na ordem inversa de dependência.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS bloodstock_movement');
    await queryRunner.query('DROP TABLE IF EXISTS stock');
    await queryRunner.query('DROP TABLE IF EXISTS batch_blood');
    await queryRunner.query('DROP TABLE IF EXISTS batch');
    await queryRunner.query('DROP TABLE IF EXISTS company');
  }
}