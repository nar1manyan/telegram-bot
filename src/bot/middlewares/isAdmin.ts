import { AdminModel } from '../../model/admin.model';

export const isAdmin = async (id: number): Promise<boolean> => {
  const user = await AdminModel.findOne({ where: { telegram_id: id } });
  if (!user) return false;
  return true;
};