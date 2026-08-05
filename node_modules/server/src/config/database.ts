import mongoose from 'mongoose';
import { env } from './env.js';
import { seedDemoData } from './demoData.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected');
    await seedDemoData();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    if (env.NODE_ENV === 'development') {
      console.warn('Falling back to demo mode with in-memory data. Some persistence features will be limited.');
      return;
    }
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});
