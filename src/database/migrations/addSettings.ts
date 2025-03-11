import { DBSettings } from '../../model/db.settings.model';
import { AdminModel } from '../../model/admin.model';

const addSettings = async () => {

  const users = await AdminModel.findAll() as any;
  for (const user of users) {
    await DBSettings.bulkCreate(
      [
        {
          name: 'logged',
          value: false,
          for: user.telegram_id,
        },
      ],
    );
  }
};

addSettings();