import { env } from './config/env';
import app from './app';

app.listen(env.PORT, () => {
  console.log(`DATA LIFE API http://localhost:${env.PORT}`);
});
