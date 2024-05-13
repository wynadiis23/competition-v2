import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    // @Inject(CACHE_MANAGER)
    // private readonly cache: Cache,
    @InjectRedis() private readonly cache: Redis,
  ) {}

  logger = new Logger(RedisService.name);

  async set(key: string, value: any, ttl?: number) {
    try {
      this.logger.log(`Inserting ${key} to redis`);

      if (ttl) {
        await this.cache.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        await this.cache.set(key, JSON.stringify(value));
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async get(key: string) {
    try {
      const result = JSON.parse(await this.cache.get(key));

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async clearAll(keyToBeDeleted?: string[], prefix?: string) {
    try {
      if (keyToBeDeleted.length) {
        const deleteKeys: string[] = [];

        for (const key of keyToBeDeleted) {
          const keys = await this.cache.keys(`${prefix}-${key}*`);

          deleteKeys.push(...keys);
        }

        for (const key of deleteKeys) {
          await this.unset(key);
        }
      } else {
        this.logger.warn('Clear all data in Redis');

        await this.cache.flushall();
      }

      this.logger.log('Redis has been cleared');
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async unset(key: string) {
    try {
      this.logger.log(`Clear ${key} on Redis`);

      return await this.cache.del(key);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getKeys(prefix: string) {
    try {
      return await this.cache.keys(`${prefix}*`);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
