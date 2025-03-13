import { bot } from '../constant/bot.state';

export const Bot_ButtonActions = () => {
  bot.action(/fuck_button_1:(\d+)/, async (ctx) => {
    const targetId = ctx.match[1];
    await ctx.answerCbQuery(`Действие 1 выбрано! 🎉   Приступаем к выполнению...`, {
      show_alert: true,
    });
  });

  bot.action(/fuck_button_2:(\d+)/, async (ctx) => {
    const targetId = ctx.match[1];
    await ctx.answerCbQuery('Действие 2 выбрано! 🚀   Приступаем к выполнению...', { show_alert: true });
  });

  bot.action(/fuck_button_3:(\d+)/, async (ctx) => {
    const targetId = ctx.match[1];
    await ctx.answerCbQuery('Действие 3 выбрано! ⚡️  Готовы к следующему этапу...', { show_alert: true });
  });
};