import { bot, INACTIVITY_TIME } from '../constant/bot.state';
import { isAdmin } from './middlewares/isAdmin';
import { AdminModel } from '../model/admin.model';
import Bcrypt from 'bcrypt';
import { DBSettings } from '../model/db.settings.model';

export const Bot_Commands = () => {
  const userActivity: Map<number, NodeJS.Timeout> = new Map();

  function resetInactivityTimer(userId: number, ctx: any) {
    if (userActivity.has(userId)) {
      clearTimeout(userActivity.get(userId)!);
    }

    const timeout = setTimeout(async () => {
      ctx.reply('Из-за бездействия в 30 минут, вы были отключены из системы.\n\n При возвращении нужно будет заново вводить пароль!');
      await DBSettings.update(
        {
          value: false,
        },
        {
          where: {
            for: ctx.update.message.from.id,
            name: 'logged',
          },
        });
      userActivity.delete(userId);
    }, INACTIVITY_TIME);

    userActivity.set(userId, timeout);
  }

  bot.use(async (ctx: any, next) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    resetInactivityTimer(userId, ctx);

    const isUserAdmin = await isAdmin(userId);
    if (!isUserAdmin && ctx.message?.text !== '/start') return;

    if (isUserAdmin && !ctx.message?.text.includes('/password')) {
      const settings = await DBSettings.findOne({
        where: {
          for: ctx.update.message.from.id,
          name: 'logged',
        },
      }) as any;
      if (!settings.value) return ctx.reply('Неаутентифицированный неформал обнаружен!\n\nЗалогинся сучка!');
    }

    return next();
  });
  bot.start(async (ctx) => {
    if (await isAdmin(ctx.update.message.from.id)) {
      ctx.reply(`Добро пожаловать ${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}.\nЧтобы войти в систему введите пароль\n\n Пример: /password пароль`);
    } else ctx.reply('Это частный Бот.\nДоступ к нему выдается в ручную через создателя @n1endon.\nБот впредь не будет вам отвечать, пока не получите доступ.\nУдачи и хорошего дня!');
  });
  bot.command('password', async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.update.message.from.id } }) as any;
    const settings = await DBSettings.findOne({
      where: {
        for: ctx.update.message.from.id,
        name: 'logged',
      },
    }) as any;
    if (settings.value) {
      await ctx.deleteMessage(ctx.update.message.message_id);
      return ctx.reply('Вы уже в системе!');
    }
    const args = ctx.message.text.split(' ').slice(1); // Берём всё после "/password"

    if (args.length === 0)
      return ctx.reply('Вы не указали пароль.\n Пример: /password 123');

    const password = args.join(' ');

    if (!await Bcrypt.compare(password, admin?.password)) {
      await ctx.deleteMessage(ctx.update.message.message_id);
      return ctx.reply('Доступ Запрещен  🚫');
    }
    settings.update({ value: true });
    await ctx.deleteMessage(ctx.update.message.message_id);
    ctx.reply('Успешный вход! ✅');
  });

  bot.help(async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.from.id } }) as any;
    const help_commands = 'Общие команды администратора:\n\n/admins - Список админов\n/get - Поиск человека\n/delete - Удаление человека\n/update - Обновление информации о человеке\n/con_test - Выполнить проверку баз данных\n/change_pass - Смена пароля';
    if (!admin.isSuper) ctx.reply(help_commands);
    else ctx.reply(help_commands + '\n\nДоступа высшего класса:\n\n/add_admin - Добавление Администратора\n/del_admin - Удаление Администратора\n/logout {id} - Выйти из системы для другого администратора\n/fuck {id} - Пошутить над другим администратором');
  });

  bot.hears('/logout', async (ctx) => {
    await DBSettings.update(
      {
        value: false,
      },
      {
        where: {
          for: ctx.update.message.from.id,
          name: 'logged',
        },
      });
    ctx.reply('Вы успешно вышли из системы! Аривидерчи\n\nПросьба очистить чат, для дальнейшей безопасности\n\nС любовью n1endon <3');
  });

  bot.command('change_pass', async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.from.id } }) as any;
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0)
      return ctx.reply('Вы не указали пароль.\n Пример: /change_pass 123');
    const password = args.join(' ');
    admin.password = await Bcrypt.hash(password, 10);
    await ctx.deleteMessage(ctx.update.message.message_id);
    await admin.save();
    ctx.reply('Пароль успешно был изменен!');
  });
};