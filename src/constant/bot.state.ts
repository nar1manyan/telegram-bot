import { Telegraf } from 'telegraf';
import 'dotenv/config';

export const BOT_TOKEN = process.env.BOT_TOKEN;

export const bot = new Telegraf(BOT_TOKEN as any);

export const INACTIVITY_TIME = 30 * 60 * 1000;