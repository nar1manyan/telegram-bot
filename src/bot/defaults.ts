import { bot } from '../constant/bot.state';
import { isAdmin } from './middlewares/isAdmin';
import { AdminModel } from '../model/admin.model';

export const Bot_Defaults = () => {
  bot.start(async (ctx) => {
    if (await isAdmin(ctx.update.message.from.id)) {
      ctx.replyWithMarkdown(
        `👋 *Добро пожаловать, ${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}!* 🎉\n\n` +
        `🔐 *Чтобы войти в систему, введите пароль:*\n\n` +
        `💡 *Пример:* \`/password ваш_пароль\``,
        { parse_mode: 'Markdown' },
      );
    } else {
      ctx.replyWithMarkdown(
        `🚫 *Это частный бот!* 🔒\n\n` +
        `⚠️ *Доступ выдается вручную через создателя* [@n1endon](tg://user?id=n1endon).\n\n` +
        `❌ *Бот больше не будет вам отвечать, пока не получите доступ.*\n\n` +
        `✨ *Удачи и хорошего дня! Больше информации - /about *😊`,
        { parse_mode: 'Markdown' },
      );
    }
  });

  bot.help(async (ctx) => {
    const admin = await AdminModel.findOne({ where: { telegram_id: ctx.from.id } }) as any;

    let help_commands =
      `📜 *Общие команды администратора:* 👮\n\n` +
      `🔹 \`/admins\` - Список администраторов\n` +
      `🔹 \`/get\` - Поиск человека\n` +
      `🔹 \`/delete\` - Удаление человека\n` +
      `🔹 \`/update\` - Обновление информации о человеке\n` +
      `🔹 \`/connection\` - Проверка баз данных\n` +
      `🔹 \`/change_pass\` - Смена пароля`;

    if (admin.isSuper) {
      help_commands +=
        `\n\n🛠 *Команды для супер-администраторов:* 👑\n\n` +
        `🚨 \`/destroy\` - Удаление администратора\n` +
        `📴 \`/remote_logout {id}\` - Выйти из системы для другого администратора\n` +
        `😂 \`/fuck {id}\` - Пошутить над другим администратором`;
    }

    ctx.replyWithMarkdown(help_commands, { parse_mode: 'Markdown' });
  });

  bot.command('about', (ctx) => {
    ctx.replyWithMarkdownV2(
      `🔍 *ПОИСКОВЫЙ БОТ* 🔍

✨ *О чём этот бот?*\n\n
_Я — приватный поисковик пользователей интернет-платформ.  
Моя база обновляется ежедневно, но доступ к ней строго ограничен._

🔒 *Как получить доступ?*\n\n
1. Используй команду \`/ask\`  
2. Жди одобрения администратора ⏳  

⚠️ *Важно знать*\n\n
▫️ _Нет_ публичной продажи доступов  
▫️ _Нет_ автоматической выдачи прав  
▫️ Спам = мгновенная блокировка 🚫
▫️ Среднее время ответа: 1-3 дня 📅  

🛡 Администратор оставляет за собой право:  
▫️ Отказать без объяснения причин  
▫️ Запросить дополнительную информацию  
▫️ Изменить правила доступа`,
      { parse_mode: "Markdown" }
    );
  });
};