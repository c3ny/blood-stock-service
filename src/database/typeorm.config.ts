import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Opções centrais de conexão do TypeORM para execução da aplicação
 * e para comandos de migração.
 */
export const appDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'sangue_solidario',
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: ['src/database/migrations/*.ts', 'dist/database/migrations/*.js'],
  synchronize: false,
  logging: !isProduction,
};

/**
 * DataSource utilizado por CLI/migrations para operações no banco.
 */
const appDataSource = new DataSource(appDataSourceOptions);
export default appDataSource;