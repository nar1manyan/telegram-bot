import { bot, INACTIVITY_TIME, owners } from '../constant/bot.state';
import { isAdmin } from './middlewares/isAdmin';
import { AdminModel } from '../model/admin.model';
import { DBSettings } from '../model/db.settings.model';
import { RequestedUsersModel } from '../model/requested.users.model';
import { v4 as uuid } from 'uuid';
import { Markup } from 'telegraf';
import Bcrypt from 'bcrypt';

export const Bot_Commands = () => {
  const userActivity: Map<number, NodeJS.Timeout> = new Map();

  function resetInactivityTimer(userId: number, ctx: any) {
    if (userActivity.has(userId)) {
      clearTimeout(userActivity.get(userId)!);
    }

    const timeout = setTimeout(async () => {
      ctx.replyWithMarkdown(
        `⏳ *Из-за бездействия в 30 минут, вы были отключены из системы.*\n\n` +
        `🔐 *При возвращении потребуется заново ввести пароль!*`,
      );

      await DBSettings.update(
        { value: false },
        { where: { for: ctx.update.message.from.id, name: 'logged' } },
      );

      userActivity.delete(userId);
    }, INACTIVITY_TIME);

    userActivity.set(userId, timeout);
  }

  bot.use(async (ctx: any, next) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    resetInactivityTimer(userId, ctx);

    const isUserAdmin = await isAdmin(userId);

    if (!isUserAdmin && ctx.message?.text !== '/start' && ctx.message?.text !== '/ask' && ctx.message?.text !== '/about') return;

    if (isUserAdmin && !ctx.message?.text.includes('/password') && ctx.message?.text !== '/ask') {
      const settings = await DBSettings.findOne({
        where: { for: ctx.from.id, name: 'logged' },
      }) as any;

      if (!settings.value) return ctx.replyWithMarkdown('🚨 *Неаутентифицированный неформал обнаружен!*\n\n🔑 *Залогинся, сучка!*');
    }

    return next();
  });

  bot.command('password', async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.update.message.from.id } }) as any;
    const settings = await DBSettings.findOne({ where: { for: ctx.update.message.from.id, name: 'logged' } }) as any;

    if (settings.value) {
      await ctx.deleteMessage(ctx.update.message.message_id);
      return ctx.replyWithMarkdown('✅ *Вы уже в системе!*');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) return ctx.replyWithMarkdown('⚠️ *Вы не указали пароль.*\n\nПример: `/password 123`');

    const password = args.join(' ');

    if (!await Bcrypt.compare(password, admin?.password)) {
      await ctx.deleteMessage(ctx.update.message.message_id);
      return ctx.replyWithMarkdown('🚫 *Доступ запрещен!*');
    }

    settings.update({ value: true });
    await ctx.deleteMessage(ctx.update.message.message_id);
    ctx.replyWithMarkdown('🔓 *Успешный вход!* ✅');
  });

  bot.command('change_pass', async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.from.id } }) as any;
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) return ctx.replyWithMarkdown('⚠️ *Вы не указали новый пароль.*\n\nПример: `/change_pass 123`');

    admin.password = await Bcrypt.hash(args.join(' '), 10);
    await ctx.deleteMessage(ctx.update.message.message_id);
    await admin.save();
    ctx.replyWithMarkdown('🔑 *Пароль успешно изменен!* ✅');
  });

  bot.command('accept', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) return ctx.replyWithMarkdown('⚠️ *Неправильное использование команды.*\n\nПример: `/accept telegram_id 0`');

    const requester = await RequestedUsersModel.findOne({ where: { telegram_id: args[0] } }) as any;
    if (!requester) return ctx.replyWithMarkdown('🚫 *Неверный Telegram ID!*');

    await AdminModel.create({
      id: uuid(),
      telegram_id: args[0],
      password: '$2b$10$jZuPOcrjVrLD153bGBky6Opo03aDA7Gk1oE./AgAdU36jP4QhS97i',
      full_name: requester.full_name,
      isSuper: args[1] || 0,
    });

    await DBSettings.create({
      id: uuid(),
      name: 'logged',
      value: false,
      for: args[0],
    });

    await requester.destroy();
    ctx.replyWithMarkdown('🎉 *Администратор успешно добавлен!* ✅');

    setTimeout(async () => {
      await bot.telegram.sendMessage(
        args[0],
        '👑 *Администратор подтвердил ваш доступ!*\n\n' +
        '🔑 *Перед началом работы смените пароль!* (Старый: `123123`)\n\n' +
        '📌 Используйте команду: `/change_pass ваш_пароль`',
        { parse_mode: 'Markdown' });
    }, 2000);
  });

  bot.command('remote_logout', async (ctx) => {
    const isSuper = await AdminModel.findOne({ where: { telegram_id: ctx.from.id, isSuper: true } });
    if (!isSuper) return ctx.replyWithMarkdown('🚫 *Доступ запрещен!*');

    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.replyWithMarkdown('⚠️ *Неправильный Telegram ID.*\n\nПример: `/remote_logout telegram_id`');

    const settings = await DBSettings.findOne({ where: { for: args[0], name: 'logged', value: true } }) as any;
    if (!settings) return ctx.replyWithMarkdown('🔍 *Пользователь не найден или не вошел в систему.*');

    settings.value = false;
    await settings.save();

    ctx.replyWithMarkdown('✅ *Администратор успешно удален из системы!*');
    await bot.telegram.sendMessage(
      args[0],
      '🚨 *Вы были разлогинены супер-администратором без вашего ведома.*\n\n' +
      '😡 *Если вы с этим не согласны — набейте ему ебало.*',
      { parse_mode: 'Markdown' });
  });

  bot.command('destroy', async (ctx) => {
    const isSuper = await AdminModel.findOne({ where: { telegram_id: ctx.from.id, isSuper: true } });
    if (!isSuper) return ctx.replyWithMarkdown('🚫 *Доступ запрещен!*');

    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.replyWithMarkdown('⚠️ *Неправильный Telegram ID.*\n\nПример: `/destroy telegram_id`');

    const del_admin = await AdminModel.findOne({ where: { telegram_id: args[0] } }) as any;
    if (!del_admin || del_admin.isSuper) {
      return ctx.replyWithMarkdown('🚫 *Администратор не найден или попытка удалить супер-админа!*');
    }

    await del_admin.destroy();
    await DBSettings.destroy({ where: { for: args[0] } });

    await ctx.replyWithMarkdown('🛑 *Администратор успешно удален!*');
    await bot.telegram.sendMessage(
      args[0],
      '📜 *Вы были исключены из Школы Чародейства и Волшебства «Хогвартс»!*\n\n' +
      '🚷 *Теперь вы больше не можете использовать данного бота.*\n\n' +
      '🔎 *Для уточнения причины обратитесь к администратору.*',
      { parse_mode: 'Markdown' });
  });

  bot.command('fuck', async (ctx) => {
    const isSuper = await AdminModel.findOne({ where: { telegram_id: ctx.from.id, isSuper: true } });
    if (!isSuper) return ctx.replyWithMarkdown('🚫 *Доступ запрещен!*');
    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.replyWithMarkdown('⚠️ *Неправильный Telegram ID.*\n\nПример: `/destroy telegram_id`');
    if (args[0] === owners[0].toString()) return ctx.replyWithMarkdown('⚠️ *Над собой пошути далбаеб*\n\n`#НехуйВагеТрогать`');
    const targetId = args[0];
    if (!targetId) return ctx.replyWithMarkdown('⚠️ *Неправильный Telegram ID.*\n\nПример: `/fuck telegram_id`');
    await ctx.reply(
      '🌟 *Выберите одну из шуток:* 🌟\n\nКаждая шутка уникальна, и должно быть смешно! 💡\n_Нажми на кнопку, чтобы подшутить над далбаебом._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔥 Отправить шуточное оскорбление', callback_data: `fuck_button_1:${targetId}` },
              { text: '💥 Спам и заебка', callback_data: `fuck_button_2:${targetId}` },
              { text: '⚡️ Отправить смешное голосовое', callback_data: `fuck_button_3:${targetId}` },
            ],
          ],
        },
      },
    );
  });
};