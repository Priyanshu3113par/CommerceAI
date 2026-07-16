import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';

async function start() {
  await connectDatabase();
  await connectRedis();

  app.listen(env.PORT, () => {
    console.log(`Commerce-AI server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

start();
