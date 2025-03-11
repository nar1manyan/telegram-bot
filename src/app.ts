import express, { Express } from 'express';
import { Bot_Commands } from './bot/commands';
import Bot_start from './bot/bot_init';
import './model/index';

const app: Express = express();

Bot_Commands();
Bot_start();

export default app;