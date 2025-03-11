import { Database } from '../database/init';
import { DataTypes, UUID } from 'sequelize';

export const AdminModel = Database.define('admins', {
  id: { type: DataTypes.UUID(), primaryKey: true, unique: true },
  telegram_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  isSuper: { type: DataTypes.BOOLEAN, defaultValue: false },
});