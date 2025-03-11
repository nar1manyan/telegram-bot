import { Database } from './database/init';
import App from './app';
import 'dotenv/config';

const Main = async (): Promise<void> => {
  try {
    await Database.authenticate();
    await Database.sync({ force: false });
    App.listen(process.env.PORT, (): void => console.log(`Server started on port ${process.env.PORT}`));
  } catch (e) {
    console.log(`error: ${e}` as string);
  }
};

Main();