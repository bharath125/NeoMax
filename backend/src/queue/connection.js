import IORedis from 'ioredis';
import { config } from '../config/index.js';

export const redisConnection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
