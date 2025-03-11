import { Database } from '../database/init';
import { DataTypes, UUID } from 'sequelize';

export const DBSettings = Database.define('settings', {
  id: { type: DataTypes.UUID(), primaryKey: true, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.BOOLEAN, allowNull: false },
  for: { type: DataTypes.INTEGER, allowNull: false },
});