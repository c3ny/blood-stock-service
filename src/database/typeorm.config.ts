import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Opções centrais de conexão do TypeORM para execução da aplicação
 * e para comandos de migração.
 */
export const AppDataSource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: String(process.env.POSTGRES_USERNAME),
  password: String(process.env.POSTGRES_PASSWORD),
  database: String(process.env.POSTGRES_DATABASE),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
};

/**
 * DataSource utilizado por CLI/migrations para operações no banco.
 */
const appDataSource = new DataSource(AppDataSource);
export default appDataSource;