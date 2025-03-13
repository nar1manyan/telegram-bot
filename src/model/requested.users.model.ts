import { Database } from '../database/init';
import { DataTypes, UUID } from 'sequelize';

export const RequestedUsersModel = Database.define('requested_users', {
  id: { type: DataTypes.UUID(), primaryKey: true, unique: true },
  telegram_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
});