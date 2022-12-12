import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
config();

export const DatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: `${process.env.POSTGRES_HOST}`,
  username: `${process.env.POSTGRES_USER}`,
  password: `${process.env.POSTGRES_PASSWORD}`,
  database: `${process.env.POSTGRES_DB}`,
  port: 5432,
  synchronize: false,
  migrationsRun: false,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/**/*{.ts,.js}'],
  cli: { migrationsDir: 'src/database/migrations' },
};

export default DatabaseConfig;
