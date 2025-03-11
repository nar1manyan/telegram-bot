import { AdminModel } from './admin.model';
import { DBSettings } from './db.settings.model';
import { v4 as uuid } from 'uuid';

const Models = async () => {
  await AdminModel.sync();
  await DBSettings.sync();
};

Models();
