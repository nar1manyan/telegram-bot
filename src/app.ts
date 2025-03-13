import express, { Express } from 'express';
import { Bot_Commands } from './bot/commands';
import { Bot_start } from './bot/bot_init';
import { Bot_listeners } from './bot/listener';
import { Bot_Defaults } from './bot/defaults';
import './model/index';
import { Bot_ButtonActions } from './bot/button.actions';

const app: Express = express();

Bot_ButtonActions(); // Кнопки бота
Bot_Commands(); //Команды которые требуют параметр;
Bot_listeners(); //Команды, которые не требуют ничего, работают без доп. информации
Bot_Defaults();// Команды бота которые должны стоять по умолчанию
Bot_start(); // После всех внедрений команд, обычный старт бота.

export default app;