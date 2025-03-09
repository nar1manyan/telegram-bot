import { Sequelize } from 'sequelize';
import 'dotenv/config';

export const Database = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    dialect: 'mysql',
    host: process.env.DB_HOST as string,
  },
);