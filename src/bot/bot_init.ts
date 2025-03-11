import { Telegraf } from 'telegraf';
import { bot } from '../constant/bot.state';

const Bot_start = () => {
  bot.launch({})
    .then(() => console.log('Бот запущен'))
    .catch((err) => console.error('Ошибка запуска бота:', err));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

export default Bot_start;