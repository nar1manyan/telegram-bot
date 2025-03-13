import { AdminModel } from '../../model/admin.model';

const addSuperAdmin = async () => {
  await AdminModel.bulkCreate([
    {
      id: '2853016c-018e-4533-90a4-85e8be342c44',
      telegram_id: 1813338150,
      full_name: 'Vahe Narimanyan',
      password: '$2b$10$dSh5eDEyOtiEk9foIm4K3uLgrj0OpxBWoqmpV/j6WfZ8YUBQbDgDW',
      isSuper: true,
    },
    // {/*
    //   id: '1853016c-018e-4533-90a4-85e8be342c44',
    //   telegram_id: 1748855835,
    //   full_name: 'm3',
    //   password: '',
    //   isSuper: true,
    // },*/
  ]);
};

addSuperAdmin();