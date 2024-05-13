import { registerAs } from '@nestjs/config';

export const redisConfiguration = registerAs('redis', () => ({
  ttl: process.env.REDIS_TTL,
  url: process.env.REDIS_URL,
}));
