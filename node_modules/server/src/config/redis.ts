import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({
  url: env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed. Caching will be disabled:', error);
  }
}

export async function getCache(key: string): Promise<string | null> {
  if (!redisClient.isOpen) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!redisClient.isOpen) return;
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }
  } catch (err) {
    console.error('Redis setCache error:', err);
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redisClient.isOpen) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Redis delCache error:', err);
  }
}

export async function invalidateProducts(): Promise<void> {
  if (!redisClient.isOpen) return;
  try {
    const keys = await redisClient.keys('products:list:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Redis invalidateProducts error:', err);
  }
}
