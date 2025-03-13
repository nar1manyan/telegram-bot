import { bot, owners } from '../constant/bot.state';
import { DBSettings } from '../model/db.settings.model';
import { RequestedUsersModel } from '../model/requested.users.model';
import { v4 as uuid } from 'uuid';
import { AdminModel } from '../model/admin.model';
import { Database } from '../database/init';
import { isAdmin } from './middlewares/isAdmin';

export const Bot_listeners = () => {
  bot.hears('/logout', async (ctx) => {
    await DBSettings.update(
      { value: false },
      {
        where: {
          for: ctx.update.message.from.id,
          name: 'logged',
        },
      },
    );

    ctx.replyWithMarkdown('🚪 *Вы успешно вышли из системы!* 🔒\n\n' +
      '⚠️ *Совет:* Очистите чат для вашей безопасности.\n\n' +
      '❤️ *С любовью,* n1endon <3',
      { parse_mode: 'Markdown' },
    );
  });

  bot.hears('/ask', async (ctx) => {
    const isAdm = await isAdmin(ctx.from.id);
    if (isAdm) return ctx.replyWithMarkdown('*❌ Не страдай хуйней, ты уже администратор!!!!! ❌*');

    const isAsked = await RequestedUsersModel.findOne({ where: { telegram_id: ctx.from.id } });

    if (isAsked) {
      return ctx.replyWithMarkdown('📩 *Вы уже отправили запрос!* ⏳\n\n' +
        'Ожидайте сообщения от администратора.',
        { parse_mode: 'Markdown' },
      );
    }

    await RequestedUsersModel.create({
      id: uuid(),
      telegram_id: ctx.from.id,
      full_name: ctx.from.first_name,
    });

    ctx.replyWithMarkdown('✅ *Запрос успешно отправлен!* 📨\n\n' +
      'Ожидайте ответа от администратора.',
      { parse_mode: 'Markdown' },
    );

    setTimeout(async () => {
      await bot.telegram.sendMessage(
        owners[0],
        '🚨 *Новая заявка на доступ!* 🚨\n\n' +
        'Чтобы проверить, используй команду 👉 `/requests`',
        { parse_mode: 'Markdown' },
      );
    }, 2000);
  });

  bot.hears('/requests', async (ctx) => {
    const isSuper = await AdminModel.findOne({ where: { telegram_id: ctx.from.id, isSuper: true } });

    if (!isSuper) {
      return ctx.replyWithMarkdown('⛔ *Доступ запрещён!* ❌\n\n' +
        'У вас нет прав для выполнения этой команды.',
        { parse_mode: 'Markdown' },
      );
    }

    const requests = await RequestedUsersModel.findAll() as any;

    if (requests.length === 0) {
      return ctx.replyWithMarkdown('📭 *Заявок нет!* ✅\n\n' +
        'Все пользователи уже рассмотрены.',
        { parse_mode: 'Markdown' },
      );
    }

    let text = '📋 *Список заявок на доступ:* 🔑\n\n';

    for (const request of requests) {
      text += `👤 *Имя:* ${request.full_name}\n` +
        `🆔 *Telegram ID:* \`${request.telegram_id}\`\n\n`;
    }

    ctx.replyWithMarkdown(text + '💡 *Чтобы принять пользователя, используйте команду* 👉 `/accept`',
      { parse_mode: 'Markdown' },
    );
  });

  bot.hears('/admins', async (ctx) => {
    const admins = await AdminModel.findAll() as any;

    if (admins.length === 0) {
      return ctx.replyWithMarkdown('🚨 *Администраторов пока нет!* ❌', { parse_mode: 'Markdown' });
    }

    let text = '👑 *Список администраторов:* 🔥\n\n';

    for (const admin of admins) {
      text += `👤 *Имя:* ${admin.full_name}\n` +
        `🔹 *Супер-админ:* ${admin.isSuper ? '✅ Да' : '❌ Нет'}\n` +
        `🆔 *Telegram ID:* \`${admin.telegram_id}\`\n\n`;
    }

    ctx.replyWithMarkdown(text + '⚙️ *Для редактирования администраторов используйте команду* 👉 `/edit_admin`',
      { parse_mode: 'Markdown' },
    );
  });

  bot.hears('/connection', async (ctx) => {
    const databases = [
      { name: 'Административная база данных', db: Database },
      // { name: 'Человеческая база данных № 1', db: null },
      // { name: 'Человеческая база данных № 2', db: null },
    ];

    let report = '📡 *Проверка соединения с базами данных:*\n\n';
    const total = databases.length;
    let checked = 0;

    const progressMessage = await ctx.replyWithMarkdown('🔄 Проверка баз данных... 0%');

    for (const { name, db } of databases) {
      try {
        await db.authenticate();
        report += `✅ *${name}* - соединение успешно\n`;
      } catch (error: any) {
        report += `❌ *${name}* - ошибка: ${error.message}\n`;
      }

      checked++;
      const progress = Math.round((checked / total) * 100);
      await ctx.telegram.editMessageText(ctx.chat.id, progressMessage.message_id, undefined, `🔄 Проверка баз данных... ${progress}%`);
    }

    await ctx.telegram.editMessageText(ctx.chat.id, progressMessage.message_id, undefined, '✅ Проверка завершена!');
    setTimeout(async () => await ctx.replyWithMarkdown(report), 1000);
  });
};